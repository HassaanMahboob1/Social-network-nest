import { Module } from '@nestjs/common';
import { SocketsGateway } from './socket.gateway';

@Module({
  providers: [SocketsGateway],
})
export class SocketModule {}
