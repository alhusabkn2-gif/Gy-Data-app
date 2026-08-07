const { data, error } = await supabase
  .from('profiles')
  .insert({
    full_name: regData.full_name,
    phone: regData.phone,
    email: regData.email || null,
    referred_by: referredBy,
    login_pin: regData.login_pin,
    purchase_pin: regData.purchase_pin,
    wallet_balance: 0,
    kyc_status: 'unverified',
    is_admin: false,
  })
  .select()
  .single();

if (error) {
  console.error(error);
  return { error: error.message };
}
