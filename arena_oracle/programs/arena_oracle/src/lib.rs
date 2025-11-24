use anchor_lang::prelude::*;

declare_id!("EE2zUctbLmQTqLT5cNhfPZDitZE2rGW491XrdmVsEn9n");

#[program]
pub mod arena_oracle {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
