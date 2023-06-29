from pyteal import *

class Property:
    class Variables:
        name = Bytes("NAME")
        image = Bytes("IMAGE")
        description = Bytes("DESCRIPTION")
        price = Bytes("PRICE")
        location = Bytes("LOCATION")
        sold = Bytes("SOLD")
    
    class AppMethods:
        buy = Bytes("Buy")


    def application_creation(self):
        return Seq([
            Assert(Txn.application_args.length() == Int(5)),
            Assert(Txn.note() == Bytes("property:uv1")),
            Assert(Btoi(Txn.application_args[3]) > Int(0)),
            App.globalPut(self.Variables.name, Txn.application_args[0]),
            App.globalPut(self.Variables.image, Txn.application_args[1]),
            App.globalPut(self.Variables.description, Txn.application_args[2]),
            App.globalPut(self.Variables.price, Btoi(Txn.application_args[3])),
            App.globalPut(self.Variables.sold, Int(0)),
            Approve()
        ])