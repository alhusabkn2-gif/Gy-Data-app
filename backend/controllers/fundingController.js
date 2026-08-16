const { supabaseAdmin } = require('../services/supabaseService');
const crypto = require('crypto');

/*
|--------------------------------------------------------------------------
| GY DATA - FUNDING CONTROLLER
|--------------------------------------------------------------------------
|
| Supported flows:
|
| 1. Customer manual funding request
|    customer -> funding_requests -> pending
|
| 2. Admin approval
|    pending request -> approve_manual_funding()
|
| 3. Admin rejection
|    pending request -> reject_manual_funding()
|
| 4. SUPER ADMIN DIRECT WALLET ADJUSTMENT
|    super admin -> admin_adjust_wallet()
|                  -> profiles.wallet_balance
|                  -> transactions
|                  -> success
|
| IMPORTANT:
|
| Super Admin direct funding NEVER creates a funding_requests row.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| SUPER ADMIN ENVIRONMENT
|--------------------------------------------------------------------------
|
| These MUST exist in Render:
|
| SUPER_ADMIN_EMAIL
| SUPER_ADMIN_PIN
| SUPER_ADMIN_SESSION_SECRET
|
| Do NOT hard-code these values.
|--------------------------------------------------------------------------
*/

const SUPER_ADMIN_EMAIL = String(
  process.env.SUPER_ADMIN_EMAIL || ''
)
  .trim()
  .toLowerCase();

const SUPER_ADMIN_PIN = String(
  process.env.SUPER_ADMIN_PIN || ''
).trim();

const SUPER_ADMIN_SESSION_SECRET = String(
  process.env.SUPER_ADMIN_SESSION_SECRET || ''
).trim();

const SUPER_ADMIN_SESSION_TTL_MS =
  12 * 60 * 60 * 1000;


/*
|--------------------------------------------------------------------------
| BASIC VALIDATION
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
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 0;
  }

  const amount = Number(
    String(value).replace(/,/g, '').trim()
  );

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Number(
    amount.toFixed(2)
  );
}


/*
|--------------------------------------------------------------------------
| SAFE CONSTANT-TIME STRING COMPARE
|--------------------------------------------------------------------------
*/

function safeEqual(a, b) {
  const first = Buffer.from(
    String(a || ''),
    'utf8'
  );

  const second = Buffer.from(
    String(b || ''),
    'utf8'
  );

  if (
    first.length !==
    second.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    first,
    second
  );
}


/*
|--------------------------------------------------------------------------
| SUPER ADMIN SESSION TOKEN
|--------------------------------------------------------------------------
|
| Format:
|
| base64url(payload).signature
|
| The browser only stores the signed token.
|
| The PIN itself is NEVER stored in frontend.
|--------------------------------------------------------------------------
*/

function createSuperAdminToken() {
  if (
    !SUPER_ADMIN_SESSION_SECRET
  ) {
    throw new Error(
      'SUPER_ADMIN_SESSION_SECRET is not configured'
    );
  }

  const payload = {
    role: 'super_admin',
    email: SUPER_ADMIN_EMAIL,
    issuedAt: Date.now(),
    expiresAt:
      Date.now() +
      SUPER_ADMIN_SESSION_TTL_MS,
  };

  const encodedPayload =
    Buffer.from(
      JSON.stringify(payload)
    ).toString('base64url');

  const signature =
    crypto
      .createHmac(
        'sha256',
        SUPER_ADMIN_SESSION_SECRET
      )
      .update(encodedPayload)
      .digest('base64url');

  return `${encodedPayload}.${signature}`;
}


function verifySuperAdminToken(token) {
  if (
    !token ||
    !SUPER_ADMIN_SESSION_SECRET
  ) {
    return null;
  }

  const parts =
    String(token).split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [
    encodedPayload,
    providedSignature,
  ] = parts;

  const expectedSignature =
    crypto
      .createHmac(
        'sha256',
        SUPER_ADMIN_SESSION_SECRET
      )
      .update(encodedPayload)
      .digest('base64url');

  if (
    !safeEqual(
      providedSignature,
      expectedSignature
    )
  ) {
    return null;
  }

  try {
    const payload =
      JSON.parse(
        Buffer.from(
          encodedPayload,
          'base64url'
        ).toString('utf8')
      );

    if (
      payload.role !==
      'super_admin'
    ) {
      return null;
    }

    if (
      cleanEmail(payload.email) !==
      SUPER_ADMIN_EMAIL
    ) {
      return null;
    }

    if (
      !payload.expiresAt ||
      Date.now() >
        Number(payload.expiresAt)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}


/*
|--------------------------------------------------------------------------
| EXTRACT SUPER ADMIN TOKEN
|--------------------------------------------------------------------------
*/

function getBearerToken(req) {
  const authorization =
    String(
      req.headers.authorization ||
      ''
    ).trim();

  if (
    authorization
      .toLowerCase()
      .startsWith('bearer ')
  ) {
    return authorization
      .slice(7)
      .trim();
  }

  return (
    req.headers[
      'x-super-admin-token'
    ] ||
    req.body?.superAdminToken ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| SUPER ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

function authenticateSuperAdmin(
  req,
  res
) {
  if (
    !SUPER_ADMIN_EMAIL ||
    !SUPER_ADMIN_PIN
  ) {
    res.status(500).json({
      success: false,
      status: 'failed',
      message:
        'Super Admin authentication is not configured on the server',
    });

    return null;
  }

  if (
    !SUPER_ADMIN_SESSION_SECRET
  ) {
    res.status(500).json({
      success: false,
      status: 'failed',
      message:
        'SUPER_ADMIN_SESSION_SECRET is not configured',
    });

    return null;
  }

  const token =
    getBearerToken(req);

  const session =
    verifySuperAdminToken(token);

  if (!session) {
    res.status(401).json({
      success: false,
      status: 'failed',
      message:
        'Super Admin session is invalid or expired',
    });

    return null;
  }

  return {
    id: 'super-admin',
    phone: 'super-admin',
    email:
      session.email,
    is_admin: true,
    is_super_admin: true,
    role: 'super_admin',
  };
}


/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
|
| Normal admin:
| - must exist in profiles
| - is_admin must be true
|
| Super Admin:
| - MUST use signed server session
|
| Old frontend-only email headers are NOT trusted.
|--------------------------------------------------------------------------
*/

async function requireAdmin(
  req,
  res,
  options = {}
) {
  const requireSuperAdmin =
    options.superAdmin === true;

  /*
   * SUPER ADMIN ONLY
   */
  if (
    requireSuperAdmin
  ) {
    return authenticateSuperAdmin(
      req,
      res
    );
  }

  /*
   * If a valid Super Admin token exists,
   * allow it.
   */
  const token =
    getBearerToken(req);

  if (token) {
    const session =
      verifySuperAdminToken(token);

    if (session) {
      return {
        id: 'super-admin',
        phone: 'super-admin',
        email:
          session.email,
        is_admin: true,
        is_super_admin: true,
        role: 'super_admin',
      };
    }
  }

  /*
   * NORMAL ADMIN
   */
  const adminPhone =
    req.user?.phone ||
    req.body?.adminPhone ||
    req.body?.admin_phone ||
    req.headers['x-admin-phone'];

  const cleanAdminPhone =
    cleanPhone(adminPhone);

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
  } =
    await supabaseAdmin
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
      error
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

  if (
    admin.is_admin !== true
  ) {
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
    role: 'admin',
  };
}


/*
|--------------------------------------------------------------------------
| SUPER ADMIN LOGIN
|--------------------------------------------------------------------------
|
| Called by:
|
| POST /api/auth/super-admin-login
|
| Returns signed session token.
|--------------------------------------------------------------------------
*/

exports.superAdminLogin =
  async (
    req,
    res
  ) => {
    try {
      if (
        !SUPER_ADMIN_EMAIL ||
        !SUPER_ADMIN_PIN ||
        !SUPER_ADMIN_SESSION_SECRET
      ) {
        return res.status(500).json({
          success: false,
          status: 'failed',
          message:
            'Super Admin authentication is not configured',
        });
      }

      const email =
        cleanEmail(
          req.body?.email
        );

      const pin =
        String(
          req.body?.pin || ''
        ).trim();

      if (!email) {
        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            'Super Admin email is required',
        });
      }

      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            'Super Admin PIN must be 4 digits',
        });
      }

      const validEmail =
        safeEqual(
          email,
          SUPER_ADMIN_EMAIL
        );

      const validPin =
        safeEqual(
          pin,
          SUPER_ADMIN_PIN
        );

      if (
        !validEmail ||
        !validPin
      ) {
        return res.status(401).json({
          success: false,
          status: 'failed',
          message:
            'Invalid Super Admin credentials',
        });
      }

      const token =
        createSuperAdminToken();

      return res.json({
        success: true,
        status: 'success',
        message:
          'Super Admin login successful',
        token,
        expiresAt:
          Date.now() +
          SUPER_ADMIN_SESSION_TTL_MS,
        user: {
          id: 'super-admin',
          email:
            SUPER_ADMIN_EMAIL,
          role: 'super_admin',
          is_admin: true,
          is_super_admin: true,
        },
      });
    } catch (error) {
      console.error(
        'Super Admin login error:',
        error
      );

      return res.status(500).json({
        success: false,
        status: 'failed',
        message:
          'Super Admin login failed',
      });
    }
  };


/*
|--------------------------------------------------------------------------
| CUSTOMER FUNDING REQUEST
|--------------------------------------------------------------------------
*/

exports.submitFundingRequest =
  async (
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

      const clean =
        cleanPhone(phone);

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
      } =
        await supabaseAdmin
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
          profileError
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
      } =
        await supabaseAdmin
          .from('funding_requests')
          .insert({
            phone: clean,
            amount: parsedAmount,
            status: 'pending',
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
          error
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

exports.listFundingRequests =
  async (
    req,
    res
  ) => {
    try {
      const admin =
        await requireAdmin(
          req,
          res,
          {
            superAdmin: true,
          }
        );

      if (!admin) {
        return;
      }

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
              count: 'exact',
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
      } =
        await query
          .order(
            'created_at',
            {
              ascending: false,
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
          error
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
        data: data || [],
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: count || 0,
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
          res,
          {
            superAdmin: true,
          }
        );

      if (!admin) {
        return;
      }

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
          error
        );

        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            error.message ||
            'Failed to approve funding request',
        });
      }

      if (
        !data ||
        data.success !== true
      ) {
        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            data?.message ||
            'Funding approval was not completed',
          data,
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
          res,
          {
            superAdmin: true,
          }
        );

      if (!admin) {
        return;
      }

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
          error
        );

        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            error.message ||
            'Failed to reject funding request',
        });
      }

      if (
        !data ||
        data.success !== true
      ) {
        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            data?.message ||
            'Funding rejection was not completed',
          data,
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
| THIS IS THE MAIN FIX.
|
| Super Admin:
|
| phone
|   ↓
| amount
|   ↓
| admin_adjust_wallet()
|   ↓
| profiles.wallet_balance
|   ↓
| transaction
|   ↓
| SUCCESS
|
| It NEVER inserts into funding_requests.
|--------------------------------------------------------------------------
*/

exports.adminAdjustWallet =
  async (
    req,
    res
  ) => {
    try {
      /*
       * Only signed Super Admin sessions
       * may use direct wallet adjustment.
       */
      const admin =
        await requireAdmin(
          req,
          res,
          {
            superAdmin: true,
          }
        );

      if (!admin) {
        return;
      }

      const {
        phone,
        amount,
        type = 'fund',
        reason,
        notes,
      } = req.body;

      const customerPhone =
        cleanPhone(phone);

      const parsedAmount =
        cleanAmount(amount);

      if (
        customerPhone.length <
        10
      ) {
        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            'Valid customer phone number is required',
        });
      }

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

      const adjustmentType =
        String(type)
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
       * Confirm customer exists.
       *
       * This lookup does NOT change wallet.
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
       * Early refund validation.
       *
       * PostgreSQL RPC performs the final
       * locked validation.
       */
      if (
        adjustmentType ===
          'refund' &&
        Number(
          customer.wallet_balance || 0
        ) < parsedAmount
      ) {
        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            'Refund amount is greater than customer wallet balance',
        });
      }

      /*
       * CALL THE VERIFIED DATABASE RPC.
       *
       * IMPORTANT:
       *
       * No funding_requests INSERT happens here.
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
              String(
                reason ||
                notes ||
                'Super Admin wallet adjustment'
              ).trim(),

            p_admin_phone:
              'super-admin',
          }
        );

      /*
       * PostgreSQL/Supabase RPC error.
       */
      if (error) {
        console.error(
          'admin_adjust_wallet RPC error:',
          {
            message:
              error.message,
            code:
              error.code,
            details:
              error.details,
            hint:
              error.hint,
          }
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
      if (
        data === null ||
        data === undefined
      ) {
        console.error(
          'admin_adjust_wallet returned empty data'
        );

        return res.status(500).json({
          success: false,
          status: 'failed',
          message:
            'Wallet adjustment returned no result',
        });
      }

      /*
       * Supabase may return a JSON object.
       */
      const rpcResult =
        Array.isArray(data)
          ? data[0]
          : data;

      /*
       * The database function MUST explicitly
       * return success=true.
       */
      if (
        !rpcResult ||
        rpcResult.success !== true
      ) {
        console.error(
          'admin_adjust_wallet unsuccessful result:',
          rpcResult
        );

        return res.status(400).json({
          success: false,
          status: 'failed',
          message:
            rpcResult?.message ||
            'Wallet adjustment was not completed',
          data:
            rpcResult || null,
        });
      }

      /*
       * FINAL SUCCESS.
       */
      return res.status(200).json({
        success: true,
        status: 'success',
        message:
          adjustmentType === 'fund'
            ? 'Customer wallet funded successfully'
            : 'Customer wallet refunded successfully',

        data: {
          ...rpcResult,

          phone:
            rpcResult.phone ||
            customerPhone,

          amount:
            rpcResult.amount ??
            parsedAmount,

          status:
            'success',
        },
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


/*
|--------------------------------------------------------------------------
| SUPER ADMIN SESSION CHECK
|--------------------------------------------------------------------------
*/

exports.verifySuperAdmin =
  async (
    req,
    res
  ) => {
    try {
      const admin =
        await authenticateSuperAdmin(
          req,
          res
        );

      if (!admin) {
        return;
      }

      return res.json({
        success: true,
        status: 'success',
        authenticated: true,
        user: {
          id:
            admin.id,
          email:
            admin.email,
          role:
            'super_admin',
          is_super_admin:
            true,
        },
      });
    } catch (error) {
      console.error(
        'Super Admin verification error:',
        error
      );

      return res.status(500).json({
        success: false,
        status: 'failed',
        message:
          'Unable to verify Super Admin session',
      });
    }
  };
