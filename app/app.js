
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

  // Login
  Vue.component('log-in', {
    data: function() {
      return {
        username: '',
        password: ''
      }
    },
    template: `<form class="flex flex-col items-center gap-2">
    <div class="flex gap-2">
        <label for="username">Username</label>
        <input class="rounded-md" type="text" name="username" id="username" placeholder="Enter username..." required />
    </div>
    <div class="flex gap-2">
        <label for="room">Chat Channel</label>
        <select class="bg-white rounded-md" name="room" id="room">
            <option value="Business">Business </option>
            <option value="Technology">Technology</option>
            <option value="Sport">Sports</option>
            <option value="news">International News</option>
            <option value="cats">Just Cats</option>
        </select>
    </div>
    <div class="flex">
        <button @click="store.commit('setUser')" class="bg-white p-2 mt-4 rounded-xl hover:bg-gray-100">Login to Chat</button>
    </div>
</form>`,
  });

  // Input message Component
  Vue.component('input-message', {
    data: function() {
      return {
        message: ''
      };
    },
    template: ` <div class="controls field has-addons">
                        <div class="control is-expanded">
                            <input v-model="message" v-on:keydown.enter="send" class="input is-primary" placeholder="Write message">
                        </div>
                        <div class="control">
                            <button v-on:click="send" :disabled="!message" class="button is-primary">Send</button>
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
    template: ` <div class="flex gap-2" v-show="!isJoined">
                        <div class="">
                            <input v-model="room" v-on:keydown.enter="join" class="input is-primary" placeholder="Write room">
                        </div>
                        <div class="control">
                            <button v-on:click="join" :disabled="!room" class="button is-primary">Join</button>
                        </div>
                    </div>`,
    methods: {
      join: function() {
        if (this.room.length > 0) {
          // console.log('join: ' + this.room);
          this.$emit('join-room', this.room);
          this.room = '';
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
                        <div class="flex gap-2">
                            <div class="">
                                <input v-model="userName" v-on:keydown.enter="sendUserName" class="w-full rounded-md border border-gray-400" placeholder="Your name">
                            </div>
                            <div class="">
                                <button v-on:click="sendUserName" :disabled="!userName" class="rounded-md">Enter</button>
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
    props: ['users'],
    template: ` <div>
                        <h4 class="title is-4">Current users ({{users.length}})</h4>
                        <ul>
                            <li v-for="user in users">
                                <div class="media-content">
                                    <div class="content">
                                        <p>
                                            <strong>{{user.name}}</strong>
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
      },
      sendMessage: function(message) {
        if (message) {
          socket.emit('send-msg', { message: message, user: this.userName, room: this.room });
        }
      },
      setName: function(userName) {
        this.userName = userName;
        this.isLogged = true;
        socket.emit('add-user', this.userName);
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

  // When the server emits a message, the client updates message list
  socket.on('read-msg', function(message) {
    app.messages.push({ text: message.text, user: message.user, date: message.date });
  });

  // When user connects, the server emits user-connected event which updates user list
  socket.on('user-connected', function(userId) {
    app.users.push(userId);
  });

  // Init chat event. Updates the initial chat with current messages
  socket.on('init-chat', function(messages) {
    app.messages = messages;
  });

  // Init user list. Updates user list when the client init
  socket.on('update-users', function(users) {
    app.users = users;
  });
})();
