(function () {
  var socket = io();
  Vue.component("author-message", {
    props: ["messageData"],
    template: ` <div class="flex justify-end">
                        <div class="bg-white p-2 w-fit rounded-xl">
                            <p>
                                <strong>{{messageData.user}}</strong> <small>{{messageData.date}}</small>
                                <br>
                                {{messageData.text}}
                            </p>
                        </div>
                    </div>`,
  });

  Vue.component("others-message", {
    props: ["messageData"],
    template: ` <div class="">
                        <div class="bg-white p-2 w-fit rounded-xl">
                            <p>
                                <strong>{{messageData.user}}</strong> <small>{{messageData.date}}</small>
                                <br>
                                {{messageData.text}}
                            </p>
                        </div>
                    </div>`,
  });

  Vue.component("input-message", {
    data: function () {
      return {
        message: "",
      };
    },
    props: ["isJoined"],
    template: ` <div class="flex gap-2 items-center justify-center border-t border-gray-200">
                        <input v-model="message" v-on:keydown.enter="send" class="p-1 mt-2 border border-blue-400 w-full rounded-md" placeholder="Write message">
                        <button id="btn" v-on:click="send" :disabled="!message" class="mt-2 bg-blue-600 text-white p-2 rounded-xl">Send</button>
                    </div>`,
    methods: {
      send: function () {
        if (this.message.length > 0) {
          this.$emit("send-message", this.message);
          this.message = "";
        }
      },
    },
  });

  Vue.component("input-room", {
    props: ["isJoined", "isLogged"],
    data: function () {
      return {
        currentRoom: "",
      };
    },
    template: ` <div class="flex gap-2 items-center" v-show="isLogged">
							<div class="flex flex-col">
								<label class="text-gray-600" for="currentRoom">Room:</label>
								<input name="currentRoom" v-model="currentRoom" v-on:keydown.enter="join" class="p-1 mt-2 border border-blue-400 w-full rounded-md" placeholder="Write room">
							</div>
                            <button id="btn" v-on:click="join" :disabled="!currentRoom" class="mt-2 bg-blue-600 text-white p-2 rounded-xl">Join</button>
                        
                    </div>`,
    methods: {
      join: function () {
        if (this.currentRoom.length > 0) {
          // console.log('join: ' + this.room);
          this.$emit("join-room", this.currentRoom);
        }
      },
    },
  });

  Vue.component("input-name", {
    props: ["isLogged"],
    data: function () {
      return {
        userName: "",
      };
    },
    template: `<div id="nameInput" v-show="!isLogged">
                        <div class="flex gap-2 items-center">
							<div class="flex flex-col">
								<label class="text-gray-600" for="username">Username:</label>
                            	<input name="username" v-model="userName" v-on:keydown.enter="sendUserName" class="p-1 mt-2 border border-blue-400 w-full rounded-md" placeholder="Your name">
							</div>
                            <button id="btn" v-on:click="sendUserName" :disabled="!userName" class="mt-2 bg-blue-600 text-white p-2 rounded-xl">Enter</button>
                        </div>
                    </div>`,
    methods: {
      sendUserName: function () {
        if (this.userName.length > 0) {
          this.$emit("set-name", this.userName);
        }
      },
    },
  });

  Vue.component("users", {
    props: ["users", "currentroom", "username", "isJoined", "rooms"],
    template: ` <div>
                        <h4 class="title is-4"><strong>Sala:</strong> {{ isJoined ? currentroom  : 'Espera' }} ({{users.length}})</h4>
                        <ul><strong>Usuários conectados:</strong>
                            <li class="border-t border-gray-300" v-for="user in users">
                                <div class="media-content">
                                    <div class="content">
                                        <p>
                                            {{ user === username ? 'você' : user }}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        </ul>
						<ul><strong>Salas:</strong>
							<li class="border-t border-gray-300" v-for="room in rooms">
								<div class="media-content">
									<div class="content">
										<p>
											- {{ room.room }} ({{ room.users.length }})
										</p>
									</div>
								</div>
							</li>
						</ul>
                    </div>`,
  });

  var app = new Vue({
    el: "#app",
    data: {
      inactive: false,
      messages: [],
      users: [],
      userName: "",
      currentRoom: "",
      rooms: [],
      isLogged: false,
      isJoined: false,
    },
    methods: {
      joinRoom: function (room) {
        this.currentRoom = room;
        this.isJoined = true;
        socket.emit("joinRoom", {
          user: this.userName,
          room: this.currentRoom,
        });
        document.title = "JChat " + app.currentRoom;
        socket.emit("addUser", { user: this.userName, room: this.currentRoom });
      },
      sendMessage: function (message) {
        if (message != "" && !onlySpaces(message)) {
          socket.emit("sendMsg", {
            message: message,
            user: this.userName,
            room: this.currentRoom,
          });
        }
      },
      setName: function (userName) {
        this.userName = userName;
        this.isLogged = true;
      },
      scrollToEnd: function () {
        var container = this.$el.querySelector(".messages");
        container.scrollTop = container.scrollHeight;
      },
    },
    updated() {
      this.scrollToEnd();
    },
  });

  function onlySpaces(str) {
    return str.trim().length === 0;
  }

  function onlySpaces(str) {
    return str.trim().length === 0;
  }

  window.onblur = function () {
    app.inactive = true;
  }

  window.onfocus = function () {
    app.inactive = false;
    if (app.currentRoom != "") {
      document.title = "JChat " + app.currentRoom;
    }
  }

  socket.on("readMsg", function (message) {
    if (app.inactive) {
      document.title = "New message from " + message.user;
      let audio = new Audio("msn-sound.mp3");
      audio.play();
    }
    app.messages.push({
      text: message.text,
      user: message.user,
      date: message.date,
    });
  });

  socket.on("userConnected", function (userId) {
    app.users.push(userId);
  });

  socket.on("userAlreadyInRoom", function (data) {
    alert(
      "O usuário " +
        data.user +
        " já está na sala " +
        data.room +
        ".\n\n" +
        "Tente outro usuário."
    );
    app.isJoined = false;
    app.isLogged = false;
  });

  socket.on("initChat", function (messages) {
    app.messages = messages;
  });

  socket.on("updateUsers", function (users) {
    app.users = users;
  });

  socket.on("updateRooms", function (rooms) {
    app.rooms = rooms;
  });
})();
