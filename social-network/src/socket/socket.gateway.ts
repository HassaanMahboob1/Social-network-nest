import { OnModuleInit } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class SocketsGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  /**
   * Initializes the module and sets up the event listeners for the server.
   *
   * @return {void}
   */
  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
    });
    console.log('new client connected');
  }

  /**
   * Handles a message received from a client.
   *
   * @param {any} message - The message received from the client.
   * @return {void} This function does not return anything.
   */
  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: any) {
    console.log(`Message received: ${message} from client: `);
    this.server.emit('message', {
      msg: 'New Post Created',
      content: message,
    });
  }
}
