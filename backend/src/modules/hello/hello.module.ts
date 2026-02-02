import { HelloController } from "./hello.controller";
import { HelloService } from "./hello.service";
import { Module } from "@nestjs/common";

@Module({
  controllers: [HelloController],
  providers: [HelloService],
})
export class HelloModule {}