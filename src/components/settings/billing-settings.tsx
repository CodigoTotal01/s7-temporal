import { ongetSubscriptionPlan } from "@/action/settings";
import React from "react";
import { Section } from "../section-label";

type Props = {};

const BillingSettings = async (props: Props) => {
  const plan = await ongetSubscriptionPlan();
  console.log("Plan:", plan);

  return (
    <div className="grid grid-cols-1 ls:grid-cols-5 gap-10">
      <div className="lg:col-span-2">
        <Section
          message="Add payment information, pgrate and modify your plan"
          label="Billing Settings"
        />
      </div>
    </div>
  );
};
export default BillingSettings;
