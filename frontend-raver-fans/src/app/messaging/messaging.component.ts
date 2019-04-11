import { Component, OnInit, Output, EventEmitter, ViewChild, AfterContentChecked } from '@angular/core';
import { LoaderService } from './../loader/loader-service'
import { ApiCallsService } from './../api-calls.service';
import { AuthCheckService } from '../auth-check.service';
import { StateChangeService } from './../stateChange.service'
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { ModalComponent } from '../modal/modal.component'

import { SocketIoService } from './../socket-io.service'
@Component({
  selector: 'app-messaging',
  templateUrl: './messaging.component.html',
  styleUrls: ['./messaging.component.scss']
})
export class MessagingComponent implements OnInit {
  isCollapsed = true;
  constructor(
    private loader: LoaderService, public router: Router, private socket: SocketIoService,
    private apiService: ApiCallsService, private broadcaster: StateChangeService, private activeRoute: ActivatedRoute,
    private auth: AuthCheckService) {
    //let that = this;
    // this.router.routeReuseStrategy.shouldReuseRoute = function () { // turns off the shouldReuseRoute and reload the state completely
    //   return that.router.url.indexOf('messaging') ? false : true
    // }

  }


  @ViewChild('modalComponentMessaging')
  modalComponent: ModalComponent;

  userIdFromParams: string = ''

  newUrl: string = ''

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {

        this.newUrl = event.url;
        ////console.log(event)
      }
    });


    this.activeRoute.queryParams.subscribe((params) => {
      ////console.log("MESSAGING params changed", params)

      // ////console.log("MESSAGING \n\n\n\n\n ", this.userIdFromParams, params.user_id, this.userIdFromParams != params.user_id, "\n\n\n\n\n ")

      //if (this.userIdFromParams != params.user_id)
      this.getInbox(true);

      let param = this.router.parseUrl(this.router.url);
      this.userIdFromParams = param.queryParams["user_id"]

    });
    ////console.log("MESSAGING init called")

    // this.getInbox(true);

    let param = this.router.parseUrl(this.router.url);
    this.userIdFromParams = param.queryParams["user_id"]

    let that = this;
    if (localStorage.getItem('access_token')) {
      that.socket.getOnlineUsersEmit({
        'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
      }, (users) => {
        ////console.log("MESSAGING getOnlineUsers = ", users)
        that.filteredOnlineUsers = []
        that.filteredOnlineUsers = Array.from(new Set(users.onlineUsers)).map((itemInArray: any) => itemInArray.user_id)
        that.filteredOnlineUsers = Array.from(new Set(that.filteredOnlineUsers))

        that.chats.forEach(chat => {
          that.filteredOnlineUsers.forEach(user => {
            if (chat._id == user.user_id) {
              ////console.log("MESSAGING online user =  ", chat._id, chat.userName)
              chat.isOnline = true;
            }
          });
        });
      })
    }
    this.socket.receiveMessage().subscribe((message: any) => {

      //console.log("MESSAGING receiveMessage response = ", message)
      var userInboxExists = false;
      if (this.chats.length) {
        userInboxExists = this.chats.some(function (element, index) {
          if (element._id == message.sender_id._id) { // is sender of messsage already exist in the inbox, return true
            // that.chats.splice(index, 1); // first remove the chat at whereever postion it exist
            // that.chats.unshift(message); // bring chat on top
            return true;
          } else {
            return false;
          }
        });
      }
      if (!userInboxExists) {
        // that.chats.unshift(message); // bring chat on top
      }
      if (this.conversation.length) {
        //console.log("MESSAGING message.chat_room_id == this.conversation[0].chat_room_id ", message.chat_room_id == this.conversation[0].chat_room_id)
        if (message.chat_room_id == this.conversation[0].chat_room_id && this.router.url.indexOf("messaging") != -1) {
          that.conversation.push(message);
          //console.log("MESSAGING message pushed")
          setTimeout(() => {
            if (document.getElementById("chatScroller"))
              document.getElementById("chatScroller").scrollTop = 500 + document.getElementById("chatScroller").scrollHeight
          }, 100)
          this.socket.markAllMessagesRead({
            'chat_room_id': this.conversation[0].chat_room_id,
            'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
          }, function (data) {
            //console.log("MESSAGING markAllMessagesRead response = ", data)
          })
        }
      } else {
        ////console.log("MESSAGING message not pushed")
      }
      if (localStorage.getItem('access_token')) {
        this.socket.messageDelivered({
          'message_id': message._id,
          'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
        }, function (data) {
          ////console.log("MESSAGING messageDelivered response = ", data)
        })
        this.socket.getUnreadMessages({
          "x-logintoken": JSON.parse(localStorage.getItem('access_token')).value
        }, function (data) {
          that.broadcaster.getUnreadMessages(data)
          //console.log("MESSAGING getUnreadMessages response = ", data)
        })
        that.socket.getInbox({
          'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
        }, function (data) {
          that.chats = data.data;
          //console.log("MESSAGING getInbox response = ", that.chats)
        })

      }

    })
  }

  onActivate(event) {
    // this.messagingComponent = event;
  }

  followerData: any = {}

  dateObj: Date = new Date();
  month = this.dateObj.getUTCMonth() + 1; //months from 1-12
  day = this.dateObj.getUTCDate();
  year = this.dateObj.getUTCFullYear();

  currentDate = new Date(this.year + "/" + this.month + "/" + this.day).getTime() / 1000
  yesterdayDate = new Date(this.year + "/" + this.month + "/" + (this.day - 1)).getTime() / 1000
  dayAfterDate = new Date(this.year + "/" + this.month + "/" + (this.day - 2)).getTime() / 1000


  alreadySubscribedGetOnlineUsers: any;

  searchKeyword: string = ''
  chats: any = []
  selectedChat: any = ""
  getInbox(getConversation) {
    this.chats = []
    let apiUrl = "Messages/getInbox"
    if (this.searchKeyword.trim()) {
      apiUrl += "?keyword=" + this.searchKeyword;
    }
    this.apiService.getRequest(apiUrl).then(
      (res) => {
        if (res.statusCode == 200) {
          this.chats = res.data;

          if (!this.searchKeyword.trim() && getConversation) {
            if (this.userIdFromParams) {
              this.getConversation(this.userIdFromParams, true);
            } else if (this.chats.length) {
              this.getConversation(this.chats[0]._id, true);
            }
          } else {
            if (this.chats.length){
              this.getConversation(this.chats[0]._id, true);
            }else{
              this.router.navigate(["messaging"])
            }
              
          }
          let that = this;
          if (!this.alreadySubscribedGetOnlineUsers) {
            this.alreadySubscribedGetOnlineUsers = this.socket.getOnlineUsers().subscribe((users) => {
              // ////console.log("MESSAGING getOnlineUsers here = ", users)
              that.filteredOnlineUsers = []
              that.filteredOnlineUsers = Array.from(new Set(users)).map((itemInArray: any) => itemInArray.user_id)
              that.filteredOnlineUsers = Array.from(new Set(that.filteredOnlineUsers))
              ////console.log("MESSAGING filtered online users = ", that.filteredOnlineUsers)
              that.chats.forEach(chat => {
                that.filteredOnlineUsers.forEach(user => {
                  ////console.log(chat._id, " = ", user)
                  if (chat._id == user) {
                    ////console.log("MESSAGING online user =  ", chat._id, chat.userName)
                    chat.isOnline = true;
                  }
                });
              });
            })
          }

          // this.router.navigate(['/messaging/window', this.selectedChat]);

        } else {
        }
      }, (err) => {
        ////console.log("MESSAGING err", err)
      }
    );
  }
  filteredOnlineUsers: any = []

  chatSkip: any = 0;
  chatLimit: any = 20;
  totalMessages: any = 0;
  conversation: any = []
  selectedChatProfilePic: any = ''
  selectedChatUserName: any = ''
  selectedChatLastSeen: any = ''
  selectedChatRoomId: any = ''
  selectedChatUserOnline: boolean = false
  getConversation(senderId, reset) {

    ////console.log("MESSAGING reset = ", reset)
    if (reset) {
      this.hideLoadPrevious = true
      this.chatSkip = 0;
      this.chatLimit = 20;
      this.conversation = []
    }
    this.selectedChat = senderId;
    // this.socket.getOnlineUsers().subscribe((users) => {
    // ////console.log("MESSAGING getOnlineUsers = ", users)
    this.filteredOnlineUsers.forEach(user => {
      if (this.selectedChat == user.user_id) {
        this.selectedChatUserOnline = true;
      }
    });
    // });
    this.router.navigate(['messaging'], { queryParams: { user_id: senderId } });
    if (senderId) {

      ////console.log("MESSAGING here in getConversation")

      this.apiService.getRequest("Messages/getConversations?sender_id=" + senderId + "&start_point=" + this.chatSkip + "&limit=" + this.chatLimit).then(
        (res) => {
          if (res.statusCode == 200) {
            this.totalMessages = res.count
            if (this.totalMessages) {
              if (!this.conversation.length) {
                this.conversation.push(...res.data);
              } else {
                res.data.slice().reverse().forEach(element => {
                  this.conversation.splice(0, 0, element)
                });
              }
              this.chatSkip += this.chatLimit
              ////console.log("MESSAGING this.conversation = ", this.conversation)
              let that = this;
              if (this.conversation.length) {
                that.conversation.some(function (element, index) {

                  if (element.myMsg) {
                    that.selectedChatUserName = element.receiver_id.userName
                    that.selectedChatProfilePic = element.receiver_id.profile_pic
                    that.selectedChatLastSeen = element.receiver_id.last_seen

                    that.selectedChatRoomId = element.chat_room_id
                  }
                });
                that.conversation.some(function (element, index) {
                  if (!element.myMsg) {
                    that.selectedChatUserName = element.sender_id.userName
                    that.selectedChatProfilePic = element.sender_id.profile_pic
                    that.selectedChatLastSeen = element.sender_id.last_seen
                    that.selectedChatRoomId = element.chat_room_id
                  }
                });




                that.socket.canFurtherChat().subscribe((data: any) => {
                  ////console.log("MESSAGING canFurtherChat response data = ", data)
                  if (data.data_send._id == this.selectedChat) {
                    that.canChatWithUser = data.data_send.canFurtherChat;
                  }
                })

                that.socket.canChat({
                  "x-logintoken": JSON.parse(localStorage.getItem('access_token')).value,
                  "receiver_id": this.selectedChat
                }, function (data) {
                  ////console.log("MESSAGING canChat response data = ", data)
                  that.canChatWithUser = data.canFurtherChat;
                })
                that.socket.isUserTyping().subscribe((user: any) => {
                  if (user._id == this.selectedChat) {
                    that.isSelectedUserTyping = user.is_typing;
                  }
                })


                this.socket.getUnreadMessages({
                  "x-logintoken": JSON.parse(localStorage.getItem('access_token')).value
                }, function (data) {
                  that.broadcaster.getUnreadMessages(data)



                  ////console.log("MESSAGING getUnreadMessages response = ", data)
                })


                this.socket.markAllMessagesRead({
                  'chat_room_id': this.conversation[0].chat_room_id,
                  'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
                }, function (data) {
                  ////console.log("MESSAGING markAllMessagesRead response = ", data)
                  that.chats.some(function (element, index) {
                    if (element._id == senderId) {
                      element.unreadCount = 0;
                    }
                  });
                })


              }
              if (reset)
                setTimeout(() => {
                  if (document.getElementById("chatScroller"))
                    document.getElementById("chatScroller").scrollTop = 500 + document.getElementById("chatScroller").scrollHeight
                }, 100)

            } else {
              this.selectedChatUserName = res.sender_data.sender_userName
              this.selectedChatProfilePic = res.sender_data.sender_profilePic
            }
          } else {

          }
        }, (err) => {
          ////console.log("MESSAGING err", err)
        }
      );
    }
  }
  canChatWithUser: boolean = true;
  hideLoadPrevious: boolean = true;
  onScroll(event) {

    if (document.getElementById("chatScroller").scrollTop < 15) {
      this.hideLoadPrevious = true
    } else {
      this.hideLoadPrevious = false
    }
  }

  sendAttachmentListener($event) {
    var file: File = $event.target.files[0];

    this.loader.show();
    this.apiService.uploadMedia('Files/uploadTmp', file, 'false', true).then(
      (res) => {
        let that = this;
        this.loader.hide();
        let bodyData: any = res;
        if (bodyData.statusCode == 200) {
          this.socket.sendAttachment({
            'receiver_id': this.selectedChat,
            'message': bodyData.data.fileId,
            'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
          }, function (data) {
            ////console.log("MESSAGING send attachment response = ", data)
            that.conversation.push(data)

            that.socket.getInbox({
              'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
            }, function (data) {

              that.chats = data.data;
            })

            that.socket.messageDeliveryReport().subscribe((message) => {

              if (that.conversation.length) {
                //console.log("MESSAGING messageDeliveryReport message.chat_room_id == this.conversation[0].chat_room_id ", message.chat_room_id == that.conversation[0].chat_room_id)
                if (message.chat_room_id == that.conversation[0].chat_room_id && that.router.url.indexOf("messaging") != -1) {
                  that.conversation.some((msg, key) => {
                    if (message._id == msg._id) {
                      that.conversation[key].isDelivered = true;
                    }
                  })
                }
              }
              ////console.log("MESSAGING messageDeliveryReport response = ", message)
            })
            setTimeout(() => {
              if (document.getElementById("chatScroller"))
                document.getElementById("chatScroller").scrollTop = 500 + document.getElementById("chatScroller").scrollHeight
            }, 100)

          })

        } else {
        }
      }, (err) => {
        ////console.log("MESSAGING err", err)
      }
    );
  }
  message: any = ''
  sendMessage() {
    if (this.message.trim()) {
      let that = this;
      this.socket.sendMessage({
        'receiver_id': this.selectedChat,
        'message': this.message.trim(),
        'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
      }, function (data) {
        //console.log("MESSAGING send message response = ", data)
        that.conversation.push(data)


        that.socket.getInbox({
          'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
        }, function (data) {

          that.chats = data.data;

        })


        that.socket.messageDeliveryReport().subscribe((message) => {
          //console.log("MESSAGING messageDeliveryReport response = ", message)
          if (that.conversation.length) {
            //console.log("MESSAGING messageDeliveryReport message.chat_room_id == this.conversation[0].chat_room_id ", message.chat_room_id == that.conversation[0].chat_room_id)
            if (message.chat_room_id == that.conversation[0].chat_room_id && that.router.url.indexOf("messaging") != -1) {
              that.conversation.some((msg, key) => {
                if (message._id == msg._id) {
                  that.conversation[key].isDelivered = true;
                }
              })
            }
          }

        })
        setTimeout(() => {
          if (document.getElementById("chatScroller"))
            document.getElementById("chatScroller").scrollTop = 500 + document.getElementById("chatScroller").scrollHeight
        }, 100)
        // that.broadcaster.broadcastDataFunction({ _id: that.selectedChat, message: data.message, created_at: data.created_at })
        that.message = ""
      })
    }
  }


  typingTimeout;
  isSelectedUserTyping: boolean = false;


  typing() {
    let that = this;
    this.socket.isTyping({
      'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value,
      "receiver_id": this.selectedChat,
      "is_typing": true
    }, function (data) {
      ////console.log("MESSAGING isTyping true response data ", (data))
      if (that.typingTimeout) {
        clearTimeout(that.typingTimeout)
        that.typingTimeout = null;
      } else {
        that.typingTimeout = setTimeout(function () {
          that.socket.isTyping({
            'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value,
            "receiver_id": that.selectedChat,
            "is_typing": false
          }, function (data) {
            that.typingTimeout = null;
            ////console.log("MESSAGING isTyping false response data ", (data))
          });
        }, 3000)
      }
    });

  }


  confirmChatDeletion(_id, deleteWholeChat) { // deleteWholeChat ? "delete chat api":"delete message api
    this.modalComponent.action({
      params: {
        _id: _id,
        deleteWholeChat: deleteWholeChat
      },
      modalType: 'confirmation',
      message: 'Are you sure you want to delete this ' + (deleteWholeChat ? 'chat' : 'message') + '?',
    })
  }
  deleteChat(params) {
    ////console.log("MESSAGING params = ", params)
    var apiUrl = '', payload = {};
    if (params.deleteWholeChat) {
      apiUrl = "Messages/deleteChat"
      payload = { chat_room_id: params._id }
    } else {
      apiUrl = "Messages/deleteMessage"
      payload = { message_id: params._id }
    }

    this.apiService.putRequest(apiUrl, payload).then(
      (res) => {
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.modalComponent.close();
          if (params.deleteWholeChat) {
            this.selectedChat = ''
            this.getInbox('');
          } else {
            this.conversation.some((message, key) => {
              if (message._id == params._id) {
                this.conversation.splice(key, 1)
              }
            })
          }
          this.modalComponent.action({
            modalType: 'success',
            message: bodyData.message
          })
        } else {
        }
      }, (err) => {
        ////console.log("MESSAGING err", err)
      }
    );

  }
}

