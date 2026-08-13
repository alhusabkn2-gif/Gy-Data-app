const { supabaseAdmin } = require('../services/supabaseService');

/**
 * Verify that the caller is a Super Admin.
 *
 * The admin phone can come from:
 * - authenticated request user
 * - request body
 * - x-admin-phone header
 */
async function requireAdmin(req, res) {
  const adminPhone =
    req.user?.phone ||
    req.body?.adminPhone ||
    req.body?.admin_phone ||
    req.headers['x-admin-phone'];

  if (!adminPhone) {
    res.status(401).json({
      success: false,
      message: 'Admin authentication is required',
    });

    return null;
  }

  const { data: admin, error } = await supabaseAdmin
    .from('profiles')
    .select('id, phone, is_admin')
    .eq('phone', adminPhone)
    .maybeSingle();

  if (error) {
    console.error('Admin verification error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to verify admin account',
    });

    return null;
  }

  if (!admin) {
    res.status(403).json({
      success: false,
      message: 'Admin account not found',
    });

    return null;
  }

  if (admin.is_admin !== true) {
    res.status(403).json({
      success: false,
      message: 'Super Admin permission required',
    });

    return null;
  }

  return admin;
}


/**
 * POST /api/funding/request
 *
 * Customer submits manual funding request.
 */
exports.submitFundingRequest = async (req, res) => {
  try {
    const {
      phone,
      amount,
      paymentMethod,
      paymentReference,
      notes,
    } = req.body;

    const parsedAmount = Number(amount);

    if (
      !phone ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Phone and valid amount are required',
      });
    }

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .select('phone')
        .eq('phone', phone)
        .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    const { data, error } = await supabaseAdmin
      .from('funding_requests')
      .insert({
        phone,
        amount: parsedAmount,
        status: 'pending',
        payment_method: paymentMethod || 'manual',
        payment_reference: paymentReference || null,
        notes: notes || null,
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
        message: 'Failed to create funding request',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Funding request submitted successfully',
      data,
    });
  } catch (error) {
    console.error(
      'Submit funding request error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


/**
 * GET /api/funding/requests
 *
 * Super Admin only.
 */
exports.listFundingRequests = async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);

    if (!admin) return;

    const {
      status = 'pending',
      phone,
      page = 1,
      limit = 20,
    } = req.query;

    const safePage = Math.max(
      Number(page) || 1,
      1
    );

    const safeLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const offset =
      (safePage - 1) * safeLimit;

    let query = supabaseAdmin
      .from('funding_requests')
      .select('*', {
        count: 'exact',
      });

    if (status) {
      query = query.eq('status', status);
    }

    if (phone) {
      query = query.eq('phone', phone);
    }

    const {
      data,
      error,
      count,
    } = await query
      .order('created_at', {
        ascending: false,
      })
      .range(
        offset,
        offset + safeLimit - 1
      );

    if (error) {
      console.error(
        'List funding requests error:',
        error.message
      );

      return res.status(500).json({
        success: false,
        message: 'Failed to list funding requests',
      });
    }

    return res.json({
      success: true,
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error(
      'List funding requests error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


/**
 * POST /api/funding/approve
 *
 * Super Admin approves customer manual funding.
 */
exports.approveFundingRequest = async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);

    if (!admin) return;

    const {
      requestId,
      adminNotes,
    } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required',
      });
    }

    const {
      data,
      error,
    } = await supabaseAdmin.rpc(
      'approve_manual_funding',
      {
        p_request_id: requestId,
        p_admin_notes:
          adminNotes || null,
      }
    );

    if (error) {
      console.error(
        'Approve funding RPC error:',
        error.message
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          'Failed to approve funding request',
      });
    }

    return res.json({
      success: true,
      message:
        'Funding request approved successfully',
      data,
    });
  } catch (error) {
    console.error(
      'Approve funding request error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


/**
 * POST /api/funding/reject
 *
 * Super Admin rejects customer manual funding.
 */
exports.rejectFundingRequest = async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);

    if (!admin) return;

    const {
      requestId,
      adminNotes,
    } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required',
      });
    }

    const {
      data,
      error,
    } = await supabaseAdmin.rpc(
      'reject_manual_funding',
      {
        p_request_id: requestId,
        p_admin_notes:
          adminNotes || null,
      }
    );

    if (error) {
      console.error(
        'Reject funding RPC error:',
        error.message
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          'Failed to reject funding request',
      });
    }

    return res.json({
      success: true,
      message:
        'Funding request rejected successfully',
      data,
    });
  } catch (error) {
    console.error(
      'Reject funding request error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


/**
 * POST /api/funding/admin-adjust
 *
 * Super Admin directly funds or refunds a customer's wallet.
 *
 * type = fund
 * type = refund
 */
exports.adminAdjustWallet = async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);

    if (!admin) return;

    const {
      phone,
      amount,
      type,
      reason,
      notes,
    } = req.body;

    const parsedAmount = Number(amount);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer phone is required',
      });
    }

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Amount must be greater than zero',
      });
    }

    if (
      type !== 'fund' &&
      type !== 'refund'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Adjustment type must be fund or refund',
      });
    }

    const {
      data: customer,
      error: customerError,
    } = await supabaseAdmin
      .from('profiles')
      .select(
        'id, phone, wallet_balance'
      )
      .eq('phone', phone)
      .maybeSingle();

    if (customerError) {
      console.error(
        'Customer lookup error:',
        customerError.message
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to find customer account',
      });
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          'Customer account not found',
      });
    }

    if (
      type === 'refund' &&
      Number(customer.wallet_balance || 0) <
        parsedAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Refund amount is greater than customer wallet balance',
      });
    }

    const {
      data,
      error,
    } = await supabaseAdmin.rpc(
      'admin_adjust_wallet',
      {
        p_customer_phone: phone,
        p_amount: parsedAmount,
        p_adjustment_type: type,
        p_reason:
          reason ||
          notes ||
          'Super Admin wallet adjustment',
        p_admin_phone: admin.phone,
      }
    );

    if (error) {
      console.error(
        'Admin wallet adjustment RPC error:',
        error.message
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          'Failed to adjust customer wallet',
      });
    }

    return res.json({
      success: true,
      message:
        type === 'fund'
          ? 'Customer wallet funded successfully'
          : 'Customer wallet refunded successfully',
      data,
    });
  } catch (error) {
    console.error(
      'Admin wallet adjustment error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
