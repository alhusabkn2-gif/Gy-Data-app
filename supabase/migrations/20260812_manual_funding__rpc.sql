/*
# GY DATA - Manual Funding RPC

Adds atomic database functions for approving and rejecting
manual wallet funding requests.

IMPORTANT:
- Does not modify the purchase flow.
- Does not modify login.
- Does not modify FundWallet.tsx.
- Wallet credit, transaction creation and request approval
  happen inside one database transaction.
- A funding request can only be processed once.
*/

-- ============================================================
-- APPROVE MANUAL FUNDING
-- ============================================================

CREATE OR REPLACE FUNCTION approve_manual_funding(
  p_request_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request funding_requests%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_transaction transactions%ROWTYPE;
  v_new_balance numeric(12,2);
BEGIN

  /*
   * Lock the funding request.
   *
   * This is important because two approval requests arriving
   * at almost the same time must not both credit the wallet.
   */
  SELECT *
  INTO v_request
  FROM funding_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Funding request not found';
  END IF;


  /*
   * A request may only be processed while it is pending.
   */
  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION
      'Funding request is not pending. Current status: %',
      v_request.status;
  END IF;


  /*
   * Lock the customer's profile before changing the wallet.
   */
  SELECT *
  INTO v_profile
  FROM profiles
  WHERE phone = v_request.phone
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Profile not found for phone: %',
      v_request.phone;
  END IF;


  /*
   * Calculate the new wallet balance.
   */
  v_new_balance := ROUND(
    (
      COALESCE(v_profile.wallet_balance, 0.00)
      + v_request.amount
    )::numeric,
    2
  );


  /*
   * Credit the customer's wallet.
   */
  UPDATE profiles
  SET
    wallet_balance = v_new_balance,
    updated_at = now()
  WHERE id = v_profile.id;


  /*
   * Create the corresponding funding transaction.
   *
   * The transactions.reference column already has a database
   * default, so PostgreSQL generates the normal GYD reference.
   */
  INSERT INTO transactions (
    phone,
    type,
    service,
    product,
    amount,
    status,
    recipient,
    network,
    metadata
  )
  VALUES (
    v_request.phone,
    'funding',
    'wallet',
    'Manual Wallet Funding',
    v_request.amount,
    'success',
    v_request.phone,
    NULL,
    jsonb_build_object(
      'funding_request_id', v_request.id,
      'payment_method', v_request.payment_method,
      'payment_reference', v_request.payment_reference,
      'admin_notes', p_admin_notes
    )
  )
  RETURNING *
  INTO v_transaction;


  /*
   * Only after the wallet and transaction have succeeded,
   * mark the funding request as approved.
   */
  UPDATE funding_requests
  SET
    status = 'approved',
    admin_notes = p_admin_notes,
    approved_at = now(),
    updated_at = now()
  WHERE id = v_request.id;


  /*
   * Return the result to fundingController.js.
   */
  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request.id,
    'phone', v_request.phone,
    'amount', v_request.amount,
    'new_wallet_balance', v_new_balance,
    'transaction_id', v_transaction.id,
    'transaction_reference', v_transaction.reference,
    'status', 'approved'
  );

END;
$$;


-- ============================================================
-- REJECT MANUAL FUNDING
-- ============================================================

CREATE OR REPLACE FUNCTION reject_manual_funding(
  p_request_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request funding_requests%ROWTYPE;
BEGIN

  /*
   * Lock the request so two admins cannot process it
   * simultaneously.
   */
  SELECT *
  INTO v_request
  FROM funding_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Funding request not found';
  END IF;


  /*
   * Only pending requests can be rejected.
   */
  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION
      'Funding request is not pending. Current status: %',
      v_request.status;
  END IF;


  /*
   * Reject the request.
   *
   * No wallet balance is changed.
   */
  UPDATE funding_requests
  SET
    status = 'rejected',
    admin_notes = p_admin_notes,
    updated_at = now()
  WHERE id = v_request.id;


  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request.id,
    'phone', v_request.phone,
    'amount', v_request.amount,
    'status', 'rejected'
  );

END;
$$;


-- ============================================================
-- SECURITY
-- ============================================================

/*
 * These functions change wallet balances.
 *
 * They must NOT be executable by normal client roles.
 * The backend uses Supabase service_role to call them.
 */

REVOKE ALL
ON FUNCTION approve_manual_funding(uuid, text)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION approve_manual_funding(uuid, text)
FROM anon;

REVOKE ALL
ON FUNCTION approve_manual_funding(uuid, text)
FROM authenticated;

GRANT EXECUTE
ON FUNCTION approve_manual_funding(uuid, text)
TO service_role;


REVOKE ALL
ON FUNCTION reject_manual_funding(uuid, text)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION reject_manual_funding(uuid, text)
FROM anon;

REVOKE ALL
ON FUNCTION reject_manual_funding(uuid, text)
FROM authenticated;

GRANT EXECUTE
ON FUNCTION reject_manual_funding(uuid, text)
TO service_role;
