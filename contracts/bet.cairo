# Declare this file as a StarkNet contract and set the required
# builtins.
%lang starknet
%builtins pedersen range_check ecdsa

from starkware.cairo.common.math import (
    abs_value, assert_250_bit, assert_in_range, assert_le, assert_le_felt, assert_lt,
    assert_lt_felt, assert_nn, assert_nn_le, assert_not_equal, assert_not_zero, sign,
    signed_div_rem, split_felt, split_int, unsigned_div_rem)
from starkware.cairo.common.cairo_builtins import (
    HashBuiltin, SignatureBuiltin)
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.signature import (
    verify_ecdsa_signature)
from starkware.starknet.common.syscalls import get_tx_signature
# Define a storage variable.
@storage_var
func balance(user_id: felt) -> (res : felt):
end

@storage_var
func bettor() -> (res : felt):
end

@storage_var
func bet_text() -> (res : felt):
end

@storage_var
func counterBettor() -> (res : felt):
end

@storage_var
func bet_amount() -> (res : felt):
end

@storage_var
func bet_reserve_amount() -> (res : felt):
end

@storage_var
func bet_judge() -> (res : felt):
end

# Increases the balance by the given amount of a user_id.
@external
func increase_balance{
        syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, ecdsa_ptr : SignatureBuiltin*}(
        user_id : felt, amount : felt):
    let (sig_len : felt, sig : felt*) = get_tx_signature()

    # Verify the signature length.
    assert sig_len = 2

    # Compute the hash of the message.
    # The hash of (x, 0) is equivalent to the hash of (x).
    let (amount_hash) = hash2{hash_ptr=pedersen_ptr}(amount, 0)

    # Verify the user's signature.
    verify_ecdsa_signature(
        message=amount_hash,
        public_key=user_id,
        signature_r=sig[0],
        signature_s=sig[1])
    let (res) = balance.read(user_id=user_id)
    balance.write(user_id, res + amount)
    return ()
end

@external
func createBet{
        syscall_ptr : felt*, 
        pedersen_ptr : HashBuiltin*,
        range_check_ptr, ecdsa_ptr : SignatureBuiltin*}(
        user_id : felt, amount : felt, bet : felt):
    assert_nn(amount)
    let (sig_len : felt, sig : felt*) = get_tx_signature()

    # Verify the signature length.
    assert sig_len = 2

    # Compute the hash of the message.
    # The hash of (x, 0) is equivalent to the hash of (x).
    let (amount_hash) = hash2{hash_ptr=pedersen_ptr}(amount, 0)

    # Verify the user's signature.
    verify_ecdsa_signature(
        message=amount_hash,
        public_key=user_id,
        signature_r=sig[0],
        signature_s=sig[1])

    let (res) = balance.read(user_id=user_id)
    tempvar new_balance = res - amount

    # Make sure the new balance will be positive.
    assert_nn(new_balance)

    # Update the new balance.
    balance.write(user_id, new_balance)
    bet_reserve_amount.write(amount)
   
    bettor.write(user_id)
    bet_amount.write(amount)
    bet_text.write(bet)
    return()
end

@external
func joinCounterBettor{
        syscall_ptr : felt*, 
        pedersen_ptr : HashBuiltin*,
        range_check_ptr}(
        user_id : felt):
    assert_not_zero(user_id)
    let (b1) = bettor.read()
    let (j1) = bet_judge.read()
    assert_not_equal(b1, user_id)
    assert_not_equal(j1, user_id)
    let (amt) = bet_amount.read()
    assert_nn(amt)
    let (res) = balance.read(user_id=user_id)
    tempvar new_balance = res - amt

    # Make sure the new balance will be positive.
    assert_nn(new_balance)

    # Update the new balance.
    balance.write(user_id, new_balance)
    bet_reserve_amount.write(amt + amt)
    counterBettor.write(user_id)
    return()
end

@external
func voteBettor{
        syscall_ptr : felt*, 
        pedersen_ptr : HashBuiltin*,
        range_check_ptr, ecdsa_ptr : SignatureBuiltin*}(
        judge : felt, bettor_id : felt):
    let (sig_len : felt, sig : felt*) = get_tx_signature()

    # Verify the signature length.
    assert sig_len = 2

    # Compute the hash of the message.
    # The hash of (x, 0) is equivalent to the hash of (x).
    let (bettor_id_hash) = hash2{hash_ptr=pedersen_ptr}(bettor_id, 0)

    # Verify the user's signature.
    verify_ecdsa_signature(
        message=bettor_id_hash,
        public_key=judge,
        signature_r=sig[0],
        signature_s=sig[1])

    let (amt) = bet_amount.read()
    let (b1) = bettor.read()
    let (b2) = counterBettor.read()
    let (j) = bet_judge.read()
    assert_nn(amt)
    assert j = judge
    let (res) = balance.read(user_id=bettor_id)
    let (prize) = bet_reserve_amount.read()
    tempvar new_balance = res + prize

    # Make sure the new balance will be positive.
    assert_nn(new_balance)

    # Update the new balance.
    balance.write(bettor_id, new_balance)
    bet_reserve_amount.write(0)    
    return()
end

@external
func joinJudge{
        syscall_ptr : felt*, 
        pedersen_ptr : HashBuiltin*,
        range_check_ptr}(
        user_id : felt):
    
    assert_not_zero(user_id)
    let (b1) = bettor.read()
    let (b2) = counterBettor.read()
    assert_not_equal(b1, user_id)
    assert_not_equal(b2, user_id)
    bet_judge.write(user_id)
    return()
end

# Returns the current balance of a user_id.
@view
func get_balance{
        syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
        range_check_ptr}(user_id: felt) -> (res : felt):
    let (res) = balance.read(user_id=user_id)
    return (res)
end
