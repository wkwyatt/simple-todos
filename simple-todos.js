Tasks = new Mongo.Collection("tasks");
if (Meteor.isServer) {
	Meteor.publish("tasks", function() {
		return Tasks.find();
	});
}

if (Meteor.isClient) {
    // This code only runs on the client
    Meteor.subscribe("tasks");
    Template.body.helpers({
    	isOwner: function() {
    		return this.owner === Meteor.userId();
    	},
    	tasks: function () {
    		if(Session.get("hideCompleted")) {
  				// If hide completed is checked, filter tasks
  				return Tasks.find({checked:{$ne:true}}, {sort:{createdAt:-1}});
  			} else {
  				// Otherwise, return all of the tasks
  				return Tasks.find({}, {sort:{createdAt:-1}});
  			}
  		},
  		hideCompleted: function() {
  			return Session.get("hideCompleted");
  		},
  		incompleteCount: function () {
  			return Tasks.find({checked:{$ne:true}}).count();
  		}
  	});

  Template.body.events({
    "submit .new-task": function (event) {
      // Prevent default browser form submit
      event.preventDefault();

      // Get value from form element
      var text = event.target.text.value;

      // Insert task into the collection
      Meteor.call("addTasks", text);

      // Clear form
      event.target.text.value = "";
    },
    "change .hide-completed input": function(event) {
    	Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.task.events({
	"click .toggle-checked": function () {
		Meteor.call("setChecked", this._id, ! this.checked)
    },
    "click .delete": function() {
    	Meteor.call("deleteTasks", this._id);
    },
    "click .toggle-private": function() {
    	Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  	Accounts.ui.config({
  		passwordSignupFields: "USERNAME_ONLY"
  	});	
}
  	Meteor.methods({
  		addTasks: function(text) {
  			if(!Meteor.userId()) {
  				throw new Meteor.Error("not-authorized");
  			}

  			Tasks.insert({
  				text: text,
		        createdAt: new Date(), // current Time
		        owner: Meteor.userId(), // id of logged in user
		        username: Meteor.user().username // username of logged in user
  			});
  		},
  		deleteTasks: function(taskId) {
  			Tasks.remove(taskId);
  		},
  		setChecked: function(taskId, setChecked) {
  			Tasks.update(taskId, {$set: {checked: setChecked}});
  		},
  		setPrivate: function(taskId, setToPrivate) {
  			var task = Task.findOne(taskId);

  			// Make sure only the task owner can make a task private
  			if(task.owner !== Meteor.userId()) {
  				throw new Meteor.Error("not-authorized");
  			}

  			Tasks.update(taskId,{$set:{private:setToPrivate}});
  		}
  	});
