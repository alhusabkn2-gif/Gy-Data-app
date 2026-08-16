const { supabaseAdmin } = require('../services/supabaseService');

/*
|--------------------------------------------------------------------------
| SUPER ADMIN CONFIGURATION
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Set these in Render Environment Variables:
|
| SUPER_ADMIN_EMAIL
| SUPER_ADMIN_PIN
|
*/

const SUPER_ADMIN_EMAIL = String(
  process.env.SUPER_ADMIN_EMAIL || 'sadmin@gyd.com'
)
  .trim()
  .toLowerCase();

const SUPER_ADMIN_PIN = String(
  process.env.SUPER_ADMIN_PIN || '1251'
).trim();


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}


function cleanPhone(value) {
  return String(value || '').replace(/\D/g, '');
}


function cleanAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Number(amount.toFixed(2));
}


/*
|--------------------------------------------------------------------------
| REQUIRE ADMIN / SUPER ADMIN
|--------------------------------------------------------------------------
*/

async function requireAdmin(req, res) {
  const adminPhone =
    req.user?.phone ||
    req.body?.adminPhone ||
    req.body?.admin_phone ||
    req.headers['x-admin-phone'];

  const superAdminEmail = cleanEmail(
    req.headers['x-super-admin-email'] ||
      req.body?.superAdminEmail ||
      req.body?.super_admin_email
  );

  /*
   * SUPER ADMIN
   */

  if (
    superAdminEmail &&
    superAdminEmail === SUPER_ADMIN_EMAIL
  ) {
    return {
      id: 'super-admin',
      phone: 'SUPER_ADMIN',
      email: SUPER_ADMIN_EMAIL,
      is_admin: true,
      is_super_admin: true,
    };
  }


  /*
   * NORMAL ADMIN
   */

  const cleanAdminPhone = cleanPhone(
    adminPhone
  );

  if (!cleanAdminPhone) {
    res.status(401).json({
      success: false,
      status: 'failed',
      message:
        'Admin authentication is required',
    });

    return null;
  }


  const {
    data: admin,
    error,
  } = await supabaseAdmin
    .from('profiles')
    .select(
      'id, phone, email, is_admin'
    )
    .eq(
      'phone',
      cleanAdminPhone
    )
    .maybeSingle();


  if (error) {
    console.error(
      'Admin verification error:',
      error.message
    );

    res.status(500).json({
      success: false,
      status: 'failed',
      message:
        'Unable to verify admin account',
    });

    return null;
  }


  if (!admin) {
    res.status(403).json({
      success: false,
      status: 'failed',
      message:
        'Admin account not found',
    });

    return null;
  }


  if (admin.is_admin !== true) {
    res.status(403).json({
      success: false,
      status: 'failed',
      message:
        'Admin permission required',
    });

    return null;
  }


  return {
    ...admin,
    is_super_admin: false,
  };
}


/*
|--------------------------------------------------------------------------
| CUSTOMER FUNDING REQUEST
|--------------------------------------------------------------------------
|
| This is the NORMAL customer funding flow.
|
| Customer:
| funding request
|      ↓
| pending
|      ↓
| Admin approval
|
| DO NOT use this for Super Admin direct wallet funding.
|--------------------------------------------------------------------------
*/

exports.submitFundingRequest = async (
  req,
  res
) => {
  try {

    const {
      phone,
      amount,
      paymentMethod,
      paymentReference,
      notes,
    } = req.body;


    const clean = cleanPhone(
      phone
    );

    const parsedAmount =
      cleanAmount(amount);


    if (
      !clean ||
      parsedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        status: 'failed',
        message:
          'Phone and valid amount are required',
      });
    }


    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from('profiles')
      .select('phone')
      .eq(
        'phone',
        clean
      )
      .maybeSingle();


    if (profileError) {
      console.error(
        'Funding profile lookup error:',
        profileError.message
      );

      return res.status(500).json({
        success: false,
        status: 'failed',
        message:
          'Unable to verify customer account',
      });
    }


    if (!profile) {
      return res.status(404).json({
        success: false,
        status: 'failed',
        message:
          'User profile not found',
      });
    }


    const {
      data,
      error,
    } = await supabaseAdmin
      .from('funding_requests')
      .insert({
        phone: clean,

        amount:
          parsedAmount,

        status:
          'pending',

        payment_method:
          paymentMethod ||
          'manual',

        payment_reference:
          paymentReference ||
          null,

        notes:
          notes ||
          null,
      })
      .select()
      .single();


    if (error) {
      console.error(
        'Funding request insert error:',
        error.message
      );

      return res.status(500).json({
        success: false,
        status: 'failed',
        message:
          'Failed to create funding request',
      });
    }


    return res.status(201).json({
      success: true,
      status: 'pending',
      message:
        'Funding request submitted successfully',
      data,
    });

  } catch (error) {

    console.error(
      'Submit funding request error:',
      error
    );

    return res.status(500).json({
      success: false,
      status: 'failed',
      message:
        'Internal server error',
    });
  }
};


/*
|--------------------------------------------------------------------------
| LIST FUNDING REQUESTS
|--------------------------------------------------------------------------
*/

exports.listFundingRequests = async (
  req,
  res
) => {

  try {

    const admin =
      await requireAdmin(
        req,
        res
      );

    if (!admin) return;


    const {
      status = 'pending',
      phone,
      page = 1,
      limit = 20,
    } = req.query;


    const safePage =
      Math.max(
        Number(page) || 1,
        1
      );


    const safeLimit =
      Math.min(
        Math.max(
          Number(limit) || 20,
          1
        ),
        100
      );


    const offset =
      (safePage - 1) *
      safeLimit;


    let query =
      supabaseAdmin
        .from(
          'funding_requests'
        )
        .select(
          '*',
          {
            count:
              'exact',
          }
        );


    if (status) {
      query =
        query.eq(
          'status',
          status
        );
    }


    if (phone) {
      query =
        query.eq(
          'phone',
          cleanPhone(phone)
        );
    }


    const {
      data,
      error,
      count,
    } = await query
      .order(
        'created_at',
        {
          ascending:
            false,
        }
      )
      .range(
        offset,
        offset +
          safeLimit -
          1
      );


    if (error) {
      console.error(
        'List funding requests error:',
        error.message
      );

      return res.status(500).json({
        success: false,
        status: 'failed',
        message:
          'Failed to list funding requests',
      });
    }


    return res.json({
      success: true,
      status: 'success',
      data:
        data || [],

      pagination: {
        page:
          safePage,

        limit:
          safeLimit,

        total:
          count || 0,
      },
    });

  } catch (error) {

    console.error(
      'List funding requests error:',
      error
    );

    return res.status(500).json({
      success: false,
      status: 'failed',
      message:
        'Internal server error',
    });
  }
};


/*
|--------------------------------------------------------------------------
| APPROVE CUSTOMER FUNDING REQUEST
|--------------------------------------------------------------------------
*/

exports.approveFundingRequest =
  async (
    req,
    res
  ) => {

    try {

      const admin =
        await requireAdmin(
          req,
          res
        );

      if (!admin) return;


      const {
        requestId,
        adminNotes,
      } = req.body;


      if (!requestId) {
        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            'Request ID is required',
        });
      }


      const {
        data,
        error,
      } =
        await supabaseAdmin.rpc(
          'approve_manual_funding',
          {
            p_request_id:
              requestId,

            p_admin_notes:
              adminNotes ||
              null,
          }
        );


      if (error) {

        console.error(
          'Approve funding RPC error:',
          error.message
        );

        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            error.message ||
            'Failed to approve funding request',
        });
      }


      return res.json({
        success: true,
        status: 'success',
        message:
          'Funding request approved successfully',
        data,
      });

    } catch (error) {

      console.error(
        'Approve funding request error:',
        error
      );

      return res.status(500).json({
        success: false,
        status: 'failed',
        message:
          'Internal server error',
      });
    }
  };


/*
|--------------------------------------------------------------------------
| REJECT CUSTOMER FUNDING REQUEST
|--------------------------------------------------------------------------
*/

exports.rejectFundingRequest =
  async (
    req,
    res
  ) => {

    try {

      const admin =
        await requireAdmin(
          req,
          res
        );

      if (!admin) return;


      const {
        requestId,
        adminNotes,
      } = req.body;


      if (!requestId) {
        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            'Request ID is required',
        });
      }


      const {
        data,
        error,
      } =
        await supabaseAdmin.rpc(
          'reject_manual_funding',
          {
            p_request_id:
              requestId,

            p_admin_notes:
              adminNotes ||
              null,
          }
        );


      if (error) {

        console.error(
          'Reject funding RPC error:',
          error.message
        );

        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            error.message ||
            'Failed to reject funding request',
        });
      }


      return res.json({
        success: true,
        status: 'success',
        message:
          'Funding request rejected successfully',
        data,
      });

    } catch (error) {

      console.error(
        'Reject funding request error:',
        error
      );

      return res.status(500).json({
        success: false,
        status: 'failed',
        message:
          'Internal server error',
      });
    }
  };


/*
|--------------------------------------------------------------------------
| SUPER ADMIN DIRECT WALLET ADJUSTMENT
|--------------------------------------------------------------------------
|
| THIS IS THE IMPORTANT PART.
|
| Super Admin:
|
| Customer Phone
|       ↓
| Amount
|       ↓
| admin_adjust_wallet()
|       ↓
| DIRECT wallet update
|       ↓
| transaction
|       ↓
| SUCCESS
|
| It NEVER creates a funding_requests row.
|--------------------------------------------------------------------------
*/

exports.adminAdjustWallet =
  async (
    req,
    res
  ) => {

    try {

      /*
       * Require admin.
       */

      const admin =
        await requireAdmin(
          req,
          res
        );

      if (!admin) return;


      /*
       * Read request.
       */

      const {
        phone,
        amount,
        type,
        reason,
        notes,
      } = req.body;


      /*
       * Clean phone.
       */

      const customerPhone =
        cleanPhone(
          phone
        );


      /*
       * Clean amount.
       */

      const parsedAmount =
        cleanAmount(
          amount
        );


      /*
       * Validate phone.
       */

      if (!customerPhone) {

        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            'Customer phone number is required',
        });

      }


      /*
       * Validate amount.
       */

      if (
        !Number.isFinite(
          parsedAmount
        ) ||
        parsedAmount <= 0
      ) {

        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            'Amount must be greater than zero',
        });

      }


      /*
       * Validate adjustment type.
       */

      const adjustmentType =
        String(
          type || 'fund'
        )
          .trim()
          .toLowerCase();


      if (
        adjustmentType !==
          'fund' &&
        adjustmentType !==
          'refund'
      ) {

        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            'Adjustment type must be fund or refund',
        });

      }


      /*
       * Verify customer exists.
       *
       * This is only a lookup.
       *
       * The actual wallet modification happens
       * INSIDE the atomic PostgreSQL RPC.
       */

      const {
        data: customer,
        error:
          customerError,
      } =
        await supabaseAdmin
          .from('profiles')
          .select(
            'id, phone, wallet_balance'
          )
          .eq(
            'phone',
            customerPhone
          )
          .maybeSingle();


      if (customerError) {

        console.error(
          'Customer lookup error:',
          customerError
        );

        return res.status(500).json({
          success: false,
          status: 'failed',
          message:
            'Failed to find customer account',
        });

      }


      if (!customer) {

        return res.status(404).json({
          success: false,
          status: 'failed',
          message:
            'Customer account not found',
        });

      }


      /*
       * For refund, make an early balance check.
       *
       * The RPC performs the final locked check too.
       */

      if (
        adjustmentType ===
          'refund' &&
        Number(
          customer.wallet_balance ||
            0
        ) <
          parsedAmount
      ) {

        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            'Refund amount is greater than customer wallet balance',
        });

      }


      /*
       * CALL THE DATABASE FUNCTION.
       *
       * This is the function that was missing.
       */

      const {
        data,
        error,
      } =
        await supabaseAdmin.rpc(
          'admin_adjust_wallet',
          {
            p_customer_phone:
              customerPhone,

            p_amount:
              parsedAmount,

            p_adjustment_type:
              adjustmentType,

            p_reason:
              reason ||
              notes ||
              'Super Admin wallet adjustment',

            p_admin_phone:
              admin.phone ||
              admin.email ||
              'super-admin',
          }
        );


      /*
       * RPC error.
       */

      if (error) {

        console.error(
          'Admin wallet adjustment RPC error:',
          error
        );

        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            error.message ||
            'Wallet funding failed',
        });

      }


      /*
       * RPC returned nothing.
       */

      if (!data) {

        return res.status(500).json({
          success: false,
          status: 'failed',
          message:
            'Wallet adjustment returned no result',
        });

      }


      /*
       * Database function must explicitly
       * confirm success.
       */

      if (
        data.success !==
        true
      ) {

        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            data.message ||
            'Wallet adjustment was not completed',

          data,
        });

      }


      /*
       * FINAL SUCCESS RESPONSE.
       */

      return res.status(200).json({

        success: true,

        status: 'success',

        message:
          adjustmentType ===
          'fund'
            ? 'Customer wallet funded successfully'
            : 'Customer wallet refunded successfully',

        data,

      });

    } catch (error) {

      console.error(
        'Admin wallet adjustment error:',
        error
      );

      return res.status(500).json({

        success: false,

        status: 'failed',

        message:
          error?.message ||
          'Internal server error',

      });

    }
  };
