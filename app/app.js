
 (function() {
  var socket = io();
  // Message Component
  Vue.component('message', {
    props: ['messageData'],
    template: ` <div class="media-content">
                        <div class="content">
                            <p>
                                <strong>{{messageData.user}}</strong> <small>{{messageData.date}}</small>
                                <br>
                                {{messageData.text}}
                            </p>
                        </div>
                    </div>`
  });

  // Input message Component
  Vue.component('input-message', {
    data: function() {
      return {
        message: ''
      };
    },
    props: ['isJoined'],
    template: ` <div class="flex gap-2 items-center justify-center border-t border-gray-200">
                        <div class="">
                            <input v-model="message" v-on:keydown.enter="send" class="p-1 mt-2 border border-blue-400 w-full rounded-md" placeholder="Write message">
                        </div>
                        <div class="">
                            <button id="btn" v-on:click="send" :disabled="!message" class="mt-2 bg-blue-600 text-white p-2 rounded-xl">Send</button>
                        </div>
                    </div>`,
    methods: {
      send: function() {
        if (this.message.length > 0) {
          this.$emit('send-message', this.message);
          this.message = '';
        }
      }
    }
  });

  // Input Room Component
  Vue.component('input-room', {
    props: ['isJoined'],
    data: function() {
      return {
        room: ''
      };
    },
    template: ` <div class="flex gap-2 items-center" v-show="!isJoined">
                            <input v-model="room" v-on:keydown.enter="join" class="p-1 mt-2 border border-blue-400 w-full rounded-md" placeholder="Write room">
                            <button id="btn" v-on:click="join" :disabled="!room" class="mt-2 bg-blue-600 text-white p-2 rounded-xl">Join</button>
                        
                    </div>`,
    methods: {
      join: function() {
        if (this.room.length > 0) {
          // console.log('join: ' + this.room);
          this.$emit('join-room', this.room);
        }
      },
    }
  });

  // Input user name Component
  Vue.component('input-name', {
    props: ['isLogged'],
    data: function() {
      return {
        userName: ''
      };
    },
    template: `<div id="nameInput" v-show="!isLogged">
                        <div class="flex gap-2 items-center">
                            <div class="">
                                <input v-model="userName" v-on:keydown.enter="sendUserName" class="p-1 mt-2 border border-blue-400 w-full rounded-md" placeholder="Your name">
                            </div>
                            <div class="">
                                <button id="btn" v-on:click="sendUserName" :disabled="!userName" class="mt-2 bg-blue-600 text-white p-2 rounded-xl">Enter</button>
                            </div>
                        </div>
                    </div>`,
    methods: {
      sendUserName: function() {
        if (this.userName.length > 0) {
          this.$emit('set-name', this.userName);
        }
      }
    }
  });

  // Users component
  Vue.component('users', {
    props: ['users', 'room', 'username', 'isJoined'],
    template: ` <div>
                        <h4 class="title is-4">Sala: {{ isJoined ? room : 'Lobby' }} ({{users.length}})</h4>
                        <ul > Ususários conectados:
                            <li class="border-t border-gray-300" v-for="user in users">
                                <div class="media-content">
                                    <div class="content">
                                        <p>
                                            <strong>{{user}}</strong>
                                        </p>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>`
  });

  // Vue instance
  var app = new Vue({
    el: '#app',
    data: {
      messages: [],
      users: [],
      userName: '',
      room: '',
      isLogged: false,
      isJoined: false
    },
    methods: {
      joinRoom: function(room) {
        this.room = room;
        this.isJoined = true;
        socket.emit('join room', {user: this.userName, room: this.room});
        socket.emit('add-user', { user: this.userName, room: this.room});
      },
      sendMessage: function(message) {
        if (message) {
          socket.emit('send-msg', { message: message, user: this.userName, room: this.room });
        }
      },
      setName: function(userName) {
        this.userName = userName;
        this.isLogged = true;
      },
      scrollToEnd: function() {
        var container = this.$el.querySelector('.messages');
        // console.log(container);
        // console.log(this.$el);
        container.scrollTop = container.scrollHeight;
      }
    },
    updated() {
      this.scrollToEnd();
    }
  });

  // Client Socket events

  socket.on('read-msg', function(message) {
    app.messages.push({ text: message.text, user: message.user, date: message.date });
  });

  socket.on('user-connected', function(userId) {
    console.log('user connected: ' + userId);
    app.users.push(userId);
  });

  socket.on('user-already-in-room', function(data) {
    alert(data.user + ' is already in room ' + data.room);
    app.isJoined = false;
    app.isLogged = false;
  });

  // Init chat event. Updates the initial chat with current messages
  // socket.on('init-chat', function(messages, room) {
  //   app.messages = messages;
  // });

  socket.on('update-users', function(users) {
    app.users = users;
  });
})();
