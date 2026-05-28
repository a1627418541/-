import { prisma } from "@/lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "123@qq.com" },
    include: { account: true },
  });

  if (!user) {
    console.log("用户不存在");
    return;
  }

  console.log("用户信息:");
  console.log("- ID:", user.id);
  console.log("- 邮箱:", user.email);
  console.log("- 名称:", user.name);
  console.log("- 邮箱已验证:", user.emailVerified);
  console.log("- 创建时间:", user.createdAt);

  console.log("\n账户信息:");
  for (const acc of user.account) {
    console.log("- Provider:", acc.providerId);
    console.log("- Account ID:", acc.accountId);
    console.log("- 有密码:", acc.password ? "是" : "否");
    console.log("- AccessToken:", acc.accessToken ? "有" : "无");
  }
}

main().catch(console.error);
