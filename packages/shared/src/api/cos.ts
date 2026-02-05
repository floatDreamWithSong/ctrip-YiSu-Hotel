import z from "zod";

export const ApiCosSchemas = {
  generatePresignedUrl: z.object({
    dir: z.string(), //上传文件的存储目录，如avatar、attach，会作为存储键的一部分
    ext: z.string(), // 文件扩展名
  })
}

export type ApiCosTypes = {
  [key in keyof typeof ApiCosSchemas as `${Capitalize<key>}`]: z.infer<typeof ApiCosSchemas[key]>
};