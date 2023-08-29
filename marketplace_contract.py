from pyteal import *

class Product:
    class Variables:
        name = Bytes("NAME")
        image = Bytes("IMAGE")
        description = Bytes("DESCRIPTION")
        price = Bytes("PRICE")
        sold = Bytes("SOLD")
        rating = Bytes("RATING")
        rating_count = Bytes("RATING_COUNT")
        owner = Bytes("OWNER")

    class AppMethods:
        buy = Bytes("buy")
        update = Bytes("update")
        gift = Bytes("gift")
        give_feedback = Bytes("give_feedback")

    def application_creation(self):
        return Seq([
            Assert(Txn.application_args.length() == Int(4)),
            Assert(Txn.note() == Bytes("marketplace:uv1")),
            Assert(Btoi(Txn.application_args[3]) > Int(0)),
            App.globalPut(self.Variables.name, Txn.application_args[0]),
            App.globalPut(self.Variables.image, Txn.application_args[1]),
            App.globalPut(self.Variables.description, Txn.application_args[2]),
            App.globalPut(self.Variables.price, Btoi(Txn.application_args[3])),
            App.globalPut(self.Variables.sold, Int(0)),
            App.globalPut(self.Variables.rating, Int(0)),
            App.globalPut(self.Variables.rating_count, Int(0)),
            App.globalPut(self.Variables.owner, Global.creator_address()),
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

    
    def update(self):
        new_price = Btoi(Txn.application_args[1])
        new_description = Txn.application_args[2]

        is_owner = Txn.sender() == Global.creator_address()

        update_conditions = And(
            is_owner,
            new_price > Int(0),
            Len(new_description) > Int(0)
        )

        update_state = Seq([
            App.globalPut(self.Variables.price, new_price),
            App.globalPut(self.Variables.description, new_description),
            Approve()
        ])

        return If(update_conditions).Then(update_state).Else(Reject())


    def gift(self):
        new_owner = Txn.application_args[1]

        is_owner = Txn.sender() == self.Variables.owner

        transfer_conditions = And(
            is_owner,
            new_owner != Global.creator_address(),
            new_owner != Global.zero_address()  # Ensure the new owner address is valid
        )

        transfer_conditions = Seq([
            App.globalPut(self.Variables.owner, Txn.application_args[1]),  # Update the owner to the new address
            Approve()
        ])

        return If(transfer_conditions).Then(transfer_state).Else(Reject())

    def give_feedback(self):
        rating = Btoi(Txn.application_args[1])

        valid_rating = And(
            rating >= Int(1),
            rating <= Int(5)
        )

        update_feedback = Seq([
            App.globalPut(self.Variables.rating, App.globalGet(self.Variables.rating) + rating),
            App.globalPut(self.Variables.rating_count, App.globalGet(self.Variables.rating_count) + Int(1)),
            Approve()
        ])

        return If(valid_rating).Then(update_feedback).Else(Reject())

    def average_rating(self):
        rating = App.globalGet(self.Variables.rating)
        rating_count = App.globalGet(self.Variables.rating_count)

        return If(rating_count > Int(0)).Then(rating / rating_count).Else(Int(0))



    def application_deletion(self):
        return Return(Txn.sender() == Global.creator_address())

    def application_start(self):
        return Cond(
            [Txn.application_id() == Int(0), self.application_creation()],
            [Txn.on_completion() == OnComplete.DeleteApplication, self.application_deletion()],
            [Txn.application_args[0] == self.AppMethods.buy, self.buy()],
            [Txn.application_args[0] == self.AppMethods.update, self.update()],
            [Txn.application_args[0] == self.AppMethods.gift, self.gift()],
            [Txn.application_args[0] == self.AppMethods.give_feedback, self.give_feedback()], 
        )

    def approval_program(self):
        return self.application_start()

    def clear_program(self):
        return Return(Int(1))

