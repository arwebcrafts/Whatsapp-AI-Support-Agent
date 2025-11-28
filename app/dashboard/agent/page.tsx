import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AgentRedirectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      agents: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // If user has an agent, redirect to agent detail page
  if (user.agents.length > 0) {
    redirect(`/dashboard/agents/${user.agents[0].id}`);
  }

  // If no agent exists, redirect to create agent page (onboarding will handle this)
  redirect("/onboarding");
}
