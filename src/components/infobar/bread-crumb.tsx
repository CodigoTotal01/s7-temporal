"use client";

import React from "react";

type Props = {};

const BreadCrumb = (props: Props) => {
  //WIP set use side bar hook for reañ tieme chat and chat bot stuff
  // WIP: Settup the description and the switch
  //
  return (
    <div className="flex flex-col">
      <div className="flex gap-5 items-center">
        <h2 className="text-3xl font-bold capitalize">Title</h2>
      </div>

      <p className="text-gray-500 text-sm">
        Modify domain settings, change chat bot options, enter sales questions
        and train yout bo what you want to ask.
      </p>
    </div>
  );
};

export default BreadCrumb;
