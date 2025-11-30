#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

#[derive(Clone)]
pub struct WillData {
    pub content_hash: String,
    pub beneficiaries: Vec<Address>,
    pub executed: bool,
}

#[contract]
pub struct Will;

#[contractimpl]
impl Will {
    pub fn create(env: Env, owner: Address, content_hash: String, beneficiaries: Vec<Address>) {
        owner.require_auth();
        let data = WillData {
            content_hash,
            beneficiaries,
            executed: false,
        };
        env.storage().set(&owner, &data);
    }

    pub fn get(env: Env, owner: Address) -> Option<WillData> {
        env.storage().get(&owner)
    }

    pub fn execute(env: Env, owner: Address) {
        let data: Option<WillData> = env.storage().get(&owner);
        if let Some(mut will) = data {
            if will.executed {
                panic!("Will already executed");
            }
            // Burada token transfer mantığı entegre edilecek
            will.executed = true;
            env.storage().set(&owner, &will);
        }
    }
}
