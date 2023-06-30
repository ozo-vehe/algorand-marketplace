from pyteal import *

class Property:
    class Variables:
        owner = Bytes("OWNER")
        name = Bytes("NAME")
        image = Bytes("IMAGE")
        description = Bytes("DESCRIPTION")
        price = Bytes("PRICE")
        location = Bytes("LOCATION")
        sold = Bytes("SOLD")
    
    class AppMethods:
        buy = Bytes("Buy")
        rent = Bytes("Rent")

    def application_creation(self):
        return Seq([
            Assert(Txn.application_args.length() == Int(6)),
            Assert(Txn.note() == Bytes("property:uv1")),
            Assert(Btoi(Txn.application_args[3]) > Int(0)),
            App.globalPut(self.Variables.owner, Txn.sender()),
            App.globalPut(self.Variables.name, Txn.application_args[1]),
            App.globalPut(self.Variables.image, Txn.application_args[2]),
            App.globalPut(self.Variables.description, Txn.application_args[3]),
            App.globalPut(self.Variables.price, Btoi(Txn.application_args[4])),
            App.globalPut(self.Variables.sold, Int(0)),
            Approve()
        ])
    

    def buy(self):
        count = Txn.application_args[1]
        valid_number_of_transactions = Global.group_size() == Int(2)

        valid_payment_to_seller = And(
            Gtxn[1].type_enum() == TxnType.Payment,
            Gtxn[1].receiver() == Global.creator_address(),
            Gtxn[1].amount() == App.globalGet(self.Variables.price) * Btoi(count),
            Gtxn[1].sender() == Gtxn[0].sender(),
        )

        can_buy = And(valid_number_of_transactions,
                      valid_payment_to_seller)

        update_state = Seq([
            App.globalPut(self.Variables.sold, App.globalGet(self.Variables.sold) + Btoi(count)),
            Approve()
        ])

        return If(can_buy).Then(update_state).Else(Reject())
    

    def rent(self):
        # Define the smart contract logic
        on_rent = Seq([
            Assert(Txn.application_id() == Int(0)),  # Check that the transaction is being called from the application
            Assert(Gtxn[0].type_enum() == TxnType.ApplicationCall),  # Check that the transaction is calling the application
            Assert(Gtxn[0].application_id() == Int(0)),  # Check that the application ID matches the current application
        
            # Define additional conditions for renting the property
            # check that sender is not the creator
            Txn.sender() != App.globalGet(self.Variables.owner),
            # For example, you can check if the sender is the property owner, the rent amount is correct, etc.
            # Add your custom conditions here
        
            Return(Int(1))  # Allow the rent transaction to proceed
        ])

        # Define the smart contract approval program
        program = Cond(
            [Txn.application_id() == Int(0), on_rent],  # Call the property rent function when the application is called
            [Txn.application_id() != Int(0), Int(1)]  # Allow non-application transactions to proceed
        )

        return program
        
    
    def application_deletion(self):
        return Return(Txn.sender() == Global.creator_address())


    def application_start(self):
        return Cond(
            [Txn.application_id() == Int(0), self.application_creation()],
            [Txn.on_completion() == OnComplete.DeleteApplication, self.application_deletion()],
            [Txn.application_args[0] == self.AppMethods.buy, self.buy()]
        )


    def approval_program(self):
        return self.application_start()

    def clear_program(self):
        return Return(Int(1))