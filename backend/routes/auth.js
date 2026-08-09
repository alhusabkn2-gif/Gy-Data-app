const express = require('express');
const crypto = require('crypto');
const { supabaseAdmin } = require('../services/supabaseService');

const router = express.Router();

function hashPin(pin) {
  return crypto
    .createHash('sha256')
    .update(String(pin))
    .digest('hex');
}

function cleanPhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

router.post('/register', async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      referral_code,
      login_pin,
      purchase_pin
    } = req.body;

    const clean = cleanPhone(phone);

    if (!full_name || !clean || !login_pin || !purchase_pin) {
      return res.status(400).json({
        success: false,
        message: 'Full name, phone, login PIN and purchase PIN are required'
      });
    }

    if (!/^\d{6}$/.test(String(login_pin))) {
      return res.status(400).json({
        success: false,
        message: 'Login PIN must be 6 digits'
      });
    }

    if (!/^\d{4}$/.test(String(purchase_pin))) {
      return res.status(400).json({
        success: false,
        message: 'Purchase PIN must be 4 digits'
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', clean)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        full_name: String(full_name).trim(),
        phone: clean,
        email: email ? String(email).trim() : null,
        login_pin: hashPin(login_pin),
        purchase_pin: hashPin(purchase_pin)
      })
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Unable to create account'
      });
    }

    delete data.login_pin;
    delete data.purchase_pin;

    return res.status(201).json({
      success: true,
      user: data
    });
  } catch (error) {
    console.error('Register error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, login_pin } = req.body;
    const clean = cleanPhone(phone);

    if (!clean || !login_pin) {
      return res.status(400).json({
        success: false,
        message: 'Phone and login PIN are required'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('phone', clean)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to login'
      });
    }

    if (!data || data.login_pin !== hashPin(login_pin)) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect phone or PIN'
      });
    }

    delete data.login_pin;
    delete data.purchase_pin;

    return res.json({
      success: true,
      user: data
    });
  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
