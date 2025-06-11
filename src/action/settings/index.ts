import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs";

export const ongetSubscriptionPlan = async () => {
  try {
    const user = await currentUser();
    if (!user) {
      return;
    }

    const plan = await client.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    });


    if (plan){
        return plan.subscription?.plan;
    }
  } catch (error) {

    console.log("ongetSubscriptionPlan  - Error fetching subscription plan:", error);
  }
};


export const onGetAllAccountDomains = async () => {
  const user = await currentUser();
  if (!user) {
    return;
  } 

  try{
    const domains = await client.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        domains: {
          select: {
            id: true,
            name: true,
            icon: true,
            customer: {
              select: {
                chatRoom: {
                  select: {
                    id: true,
                    live: true,
                  },
                }
              },
            },
          },
        },
      },
    });

    return {...domains}
  }catch (error: any) {
    console.error("onGetAllAccountDomains - Error fetching account domains:", error);
  }
}
