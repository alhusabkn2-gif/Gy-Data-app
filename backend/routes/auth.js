const express = require('express');
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../services/supabaseService');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      referral_code,
      login_pin,
      purchase_pin,
    } = req.body;

    if (!full_name || !phone || !login_pin || !purchase_pin) {
      return res.status(400).json({
        success: false,
        message: 'Full name, phone, login PIN and purchase PIN are required',
      });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');

    if (cleanPhone.length !== 11) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number',
      });
    }

    if (!/^\d{6}$/.test(String(login_pin))) {
      return res.status(400).json({
        success: false,
        message: 'Login PIN must be 6 digits',
      });
    }

    if (!/^\d{4}$/.test(String(purchase_pin))) {
      return res.status(400).json({
        success: false,
        message: 'Purchase PIN must be 4 digits',
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('phone')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already registered',
      });
    }

    let referredBy = null;

    if (referral_code) {
      const { data: referrer } = await supabaseAdmin
        .from('profiles')
        .select('phone')
        .eq('referral_code', String(referral_code).toUpperCase())
        .maybeSingle();

      if (referrer) referredBy = referrer.phone;
    }

    const loginPinHash = await bcrypt.hash(String(login_pin), 12);
    const purchasePinHash = await bcrypt.hash(String(purchase_pin), 12);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        full_name: full_name.trim(),
        phone: cleanPhone,
        email: email?.trim() || null,
        referred_by: referredBy,
        login_pin: loginPinHash,
        purchase_pin: purchasePinHash,
        wallet_balance: 0,
        cashback_balance: 0,
        kyc_status: 'unverified',
        is_admin: false,
      })
      .select(
        'id, phone, full_name, email, referral_code, referred_by, wallet_balance, cashback_balance, kyc_status, is_admin, created_at'
      )
      .single();

    if (error) {
      console.error('Registration error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Unable to create account',
      });
    }

    if (referredBy) {
      await supabaseAdmin.from('referrals').insert({
        referrer_phone: referredBy,
        referred_phone: cleanPhone,
        reward_amount: 100,
        status: 'completed',
      });
    }

    return res.status(201).json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error('Register error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, login_pin } = req.body;

    if (!phone || !login_pin) {
      return res.status(400).json({
        success: false,
        message: 'Phone and login PIN are required',
      });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to login',
      });
    }

    if (!data) {
      return res.status(401).json({
        success: false,
        message: 'Account not found',
      });
    }

    const validPin = await bcrypt.compare(
      String(login_pin),
      String(data.login_pin)
    );

    if (!validPin) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect PIN',
      });
    }

    delete data.login_pin;
    delete data.purchase_pin;

    return res.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;
