#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, String, Symbol};
use soroban_token_sdk::{metadata::TokenMetadata, TokenUtils};

const ADMIN_KEY: Symbol = symbol_short!("admin");
const META_KEY: Symbol = symbol_short!("meta");

#[contract]
pub struct Token;

#[contractimpl]
impl Token {
    pub fn initialize(e: Env, admin: Address, decimal: u32, name: String, symbol: String) {
        e.storage().instance().set(&ADMIN_KEY, &admin);
        e.storage().instance().set(
            &META_KEY,
            &TokenMetadata {
                decimal,
                name,
                symbol,
            },
        );
    }

    pub fn mint(e: Env, to: Address, amount: i128) {
        let admin: Address = e.storage().instance().get(&ADMIN_KEY).unwrap();
        admin.require_auth();

        let mut balance: i128 = e.storage().instance().get(&to).unwrap_or(0);
        balance += amount;
        e.storage().instance().set(&to, &balance);

        TokenUtils::new(&e).events().mint(admin, to, amount);
    }

    pub fn transfer(e: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        let mut from_balance: i128 = e.storage().instance().get(&from).unwrap_or(0);
        let mut to_balance: i128 = e.storage().instance().get(&to).unwrap_or(0);

        if from_balance < amount {
            panic!("Yetersiz bakiye");
        }

        from_balance -= amount;
        to_balance += amount;

        e.storage().instance().set(&from, &from_balance);
        e.storage().instance().set(&to, &to_balance);

        TokenUtils::new(&e).events().transfer(from, to, amount);
    }

    pub fn balance(e: Env, id: Address) -> i128 {
        e.storage().instance().get(&id).unwrap_or(0)
    }
}
