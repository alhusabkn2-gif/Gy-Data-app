const { supabaseAdmin } = require('../services/supabaseService');

/**
 * POST /api/funding/request
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

    if (!phone || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone and valid amount are required',
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
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
      console.error('Funding request insert error:', error.message);
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
    console.error('Submit funding request error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /api/funding/requests
 */
exports.listFundingRequests = async (req, res) => {
  try {
    const {
      status = 'pending',
      phone,
      page = 1,
      limit = 20,
    } = req.query;

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    let query = supabaseAdmin
      .from('funding_requests')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (phone) query = query.eq('phone', phone);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + safeLimit - 1);

    if (error) {
      console.error('List funding requests error:', error.message);
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
    console.error('List funding requests error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * POST /api/funding/approve
 *
 * Wallet credit + transaction + request approval
 * are performed atomically by a PostgreSQL RPC.
 */
exports.approveFundingRequest = async (req, res) => {
  try {
    const { requestId, adminNotes } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required',
      });
    }

    const { data, error } = await supabaseAdmin.rpc(
      'approve_manual_funding',
      {
        p_request_id: requestId,
        p_admin_notes: adminNotes || null,
      }
    );

    if (error) {
      console.error('Approve funding RPC error:', error.message);

      if (
        error.message.includes('not found') ||
        error.message.includes('pending') ||
        error.message.includes('profile')
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to approve funding request',
      });
    }

    return res.json({
      success: true,
      message: 'Funding request approved successfully',
      data,
    });
  } catch (error) {
    console.error('Approve funding request error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * POST /api/funding/reject
 */
exports.rejectFundingRequest = async (req, res) => {
  try {
    const { requestId, adminNotes } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required',
      });
    }

    const { data, error } = await supabaseAdmin.rpc(
      'reject_manual_funding',
      {
        p_request_id: requestId,
        p_admin_notes: adminNotes || null,
      }
    );

    if (error) {
      console.error('Reject funding RPC error:', error.message);

      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject funding request',
      });
    }

    return res.json({
      success: true,
      message: 'Funding request rejected successfully',
      data,
    });
  } catch (error) {
    console.error('Reject funding request error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
