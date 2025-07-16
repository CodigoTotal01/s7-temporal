import { ongetSubscriptionPlan } from "@/action/settings";
import React from "react";
import { Section } from "../section-label";
import { Card, CardContent, CardDescription } from "../ui/card";
import { CheckCircle2, Plus, CreditCard } from "lucide-react";
import { pricingCards } from "@/constants/landing-page";
import Modal from "../mondal";
import SubscriptionForm from "./subscription-form";

type Props = {};

const BillingSettings = async (props: Props) => {
  // WIP: Add stripe subscription form
  const plan = await ongetSubscriptionPlan();
  const planFeatures = pricingCards.find(
    (card) => card.title.toUpperCase() === plan?.toUpperCase()
  )?.features
  if (!planFeatures) return

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-2">
        <Section
          message="Add payment information, pgrate and modify your plan"
          label="Billing Settings"
        />
      </div>
      <div className="lg:col-span-2 flex justify-start lg:justify-center">
      <Modal
          title="Choose A Plan"
          description="Tell us about yourself! What do you do? Let’s tailor your experience so it best suits you."
          trigger={
            plan && plan === 'STANDARD' ? (
              <Card className="border-dashed bg-cream border-gray-400 w-full cursor-pointer h-[270px] flex justify-center items-center">
                <CardContent className="flex gap-2 items-center">
                  <div className="rounded-full border-2 p-1">
                    <Plus className="text-gray-400" />
                  </div>
                  <CardDescription className="font-semibold">
                    Upgrade Plan
                  </CardDescription>
                </CardContent>
              </Card>
            ) : (
              <div className="w-full h-[270px] bg-gradient-to-br from-[#009EE3] to-[#0078A3] rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <CreditCard className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Mercado Pago</h3>
                  <p className="text-sm opacity-90">Pago seguro y rápido</p>
                </div>
              </div>
            )
          }
        >
          <SubscriptionForm plan="PRO" />
        </Modal>
        <Card className="border-dashed bg-cream border-gray-400 w-full cursor-pointer h-[270px] flex justify-center items-center">
          <CardContent className="flex gap-2 items-center">
            <div className="rounded-full border-2 p-1">
              <Plus className="text-gray-400"></Plus>
            </div>
            <CardDescription className="font-semibold">
              Upgrade Plan
            </CardDescription>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <h3 className="text-xl font-semibold mb-2">Current Plan</h3>
        <p className="text-sm font-semibold">{plan}</p>
        <div className="flex gap-2 flex-col mt-2">
          {planFeatures.map((feature) => (
            <div
              key={feature}
              className="flex gap-2"
            >
              <CheckCircle2 className="text-muted-foreground" />
              <p className="text-muted-foreground">{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default BillingSettings;
