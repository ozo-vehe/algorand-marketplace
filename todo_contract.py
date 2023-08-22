from pyteal import *

class Todo:
    class Variables:
        title = Bytes("TITLE")
        text = Bytes("TEXT")

    class AppMethods:
        update = Bytes("update")
        read = Bytes("read")
        completed = Bytes("coompleted")

    def application_creation(self):
        return Seq([
            Assert(Txn.application_args.length() == Int(2)),
            Assert(Txn.note() == Bytes("todo:uv1")),
            App.globalPut(self.Variables.title, Txn.application_args[0]),
            App.globalPut(self.Variables.text, Txn.application_args[1]),
            Approve()
        ])

    def update(self):
        task_index = Txn.application_args[1]
        new_title = Txn.application_args[2]
        return Seq([
            Assert(Txn.application_args.length() == Int(3)),
            Assert(Txn.application_args[0] == self.AppMethods.update),
            # Assert((task_index >= Int(0)) & (task_index < App.localGet(Int(0), self.Variables.task_count))),
            App.localPut(Int(0), self.Variables.title, new_title),
            Approve()
        ])
    
    def read(self):
        task_index = Txn.application_args[1]
        task_title = App.localGet(Int(0), self.Variables.title)
        task_text = App.localGet(Int(0), self.Variables.text)
        
        return Seq([
            Assert(Txn.application_args.length() == Int(2)),
            Assert(Txn.application_args[0] == self.AppMethods.read),
            # Assert(task_index >= Int(0) & task_index < App.localGet(Int(0), self.Variables.task_count)),
            App.localPut(Int(0), self.Variables.title, task_title),
            App.localPut(Int(0), self.Variables.text, task_text),
            Approve()
        ])

    def completed(self):
        task_index = Txn.application_args[1]
        
        return Seq([
            Assert(Txn.application_args.length() == Int(2)),
            Assert(Txn.application_args[0] == self.AppMethods.completed),
            # Assert(task_index >= Int(0) & task_index < App.localGet(Int(0), self.Variables.task_count)),
            # App.localPut(Int(0), Bytes("completed_" + Bytes(task_index)), Int(1)),
            Approve()
        ])


    def application_deletion(self):
        return Return(Txn.sender() == Global.creator_address())

    def application_start(self):
        return Cond(
            [Txn.application_id() == Int(0), self.application_creation()],
            [Txn.on_completion() == OnComplete.DeleteApplication, self.application_deletion()],
            [Txn.application_args[0] == self.AppMethods.update, self.update()],
            [Txn.application_args[0] == self.AppMethods.read, self.read()],
            [Txn.application_args[0] == self.AppMethods.completed, self.completed()]
        )

    def approval_program(self):
        return self.application_start()

    def clear_program(self):
        return Return(Int(1))