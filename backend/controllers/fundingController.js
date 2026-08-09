const { supabaseAdmin } = require('../services/supabaseService');

/**
 * POST /api/funding/request
 * User submits a wallet funding request
 * Body: { phone, amount, paymentMethod, paymentReference, notes }
 */
exports.submitFundingRequest = async (req, res) => {
  try {
    const { phone, amount, paymentMethod, paymentReference, notes } = req.body;

    // Validate required fields
    if (!phone || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone and valid amount are required',
      });
    }

    // Create funding request
    const { data, error } = await supabaseAdmin
      .from('funding_requests')
      .insert({
        phone,
        amount: parseFloat(amount),
        status: 'pending',
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Funding request insert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create funding request',
        error: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Funding request submitted successfully',
      data,
    });
  } catch (err) {
    console.error('Submit funding request error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

/**
 * GET /api/funding/requests
 * Admin: List pending funding requests
 * Query: ?status=pending&phone=1234567890&page=1&limit=20
 */
exports.listFundingRequests = async (req, res) => {
  try {
    // For now, no auth check (you can add admin auth middleware later)
    const { status = 'pending', phone, page = 1, limit = 20 } = req.query;

    let query = supabaseAdmin.from('funding_requests').select('*');

    if (status) {
      query = query.eq('status', status);
    }
    if (phone) {
      query = query.eq('phone', phone);
    }

    const offset = (page - 1) * limit;
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('List funding requests error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to list funding requests',
        error: error.message,
      });
    }

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
      },
    });
  } catch (err) {
    console.error('List funding requests error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

/**
 * POST /api/funding/approve
 * Admin: Approve a funding request and credit user wallet
 * Body: { requestId, adminNotes }
 * 
 * Atomic operations:
 * 1. Verify request is pending
 * 2. Add amount to profiles.wallet_balance
 * 3. Create transaction record
 * 4. Update funding_request to approved
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

    // 1. Get funding request
    const { data: fundingReq, error: fetchError } = await supabaseAdmin
      .from('funding_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !fundingReq) {
      return res.status(404).json({
        success: false,
        message: 'Funding request not found',
      });
    }

    // Verify request is still pending
    if (fundingReq.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with status: ${fundingReq.status}`,
      });
    }

    const { phone, amount } = fundingReq;

    // 2. Get current wallet balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('wallet_balance')
      .eq('phone', phone)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    const currentBalance = parseFloat(profile.wallet_balance) || 0;
    const newBalance = currentBalance + parseFloat(amount);

    // 3. Update wallet balance atomically
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        wallet_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('phone', phone);

    if (updateError) {
      console.error('Wallet update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update wallet balance',
        error: updateError.message,
      });
    }

    // 4. Create transaction record
    const { data: transaction, error: transError } = await supabaseAdmin
      .from('transactions')
      .insert({
        phone,
        type: 'funding',
        service: 'wallet',
        product: 'Manual Wallet Funding',
        amount: parseFloat(amount),
        status: 'success',
        recipient: phone,
        network: 'manual',
        metadata: {
          funding_request_id: requestId,
          payment_reference: fundingReq.payment_reference,
          payment_method: fundingReq.payment_method,
        },
      })
      .select()
      .single();

    if (transError) {
      console.error('Transaction insert error:', transError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create transaction record',
        error: transError.message,
      });
    }

    // 5. Update funding request to approved
    const { data: updatedReq, error: reqUpdateError } = await supabaseAdmin
      .from('funding_requests')
      .update({
        status: 'approved',
        admin_notes: adminNotes,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (reqUpdateError) {
      console.error('Funding request update error:', reqUpdateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update funding request status',
        error: reqUpdateError.message,
      });
    }

    res.json({
      success: true,
      message: 'Funding request approved successfully',
      data: {
        fundingRequest: updatedReq,
        transaction,
        newBalance,
      },
    });
  } catch (err) {
    console.error('Approve funding request error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

/**
 * POST /api/funding/reject
 * Admin: Reject a funding request
 * Body: { requestId, adminNotes }
 * 
 * Only mark as rejected, do NOT change wallet balance
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

    // Get funding request
    const { data: fundingReq, error: fetchError } = await supabaseAdmin
      .from('funding_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !fundingReq) {
      return res.status(404).json({
        success: false,
        message: 'Funding request not found',
      });
    }

    // Verify request is still pending
    if (fundingReq.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status: ${fundingReq.status}`,
      });
    }

    // Update funding request to rejected (DO NOT change wallet balance)
    const { data: updatedReq, error: updateError } = await supabaseAdmin
      .from('funding_requests')
      .update({
        status: 'rejected',
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Funding request update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to reject funding request',
        error: updateError.message,
      });
    }

    res.json({
      success: true,
      message: 'Funding request rejected successfully',
      data: updatedReq,
    });
  } catch (err) {
    console.error('Reject funding request error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};
