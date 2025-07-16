"use client";

import useSideBar from "@/context/use-sidebar";
import React from "react";
import { Loader } from "../loader";
import { Switch } from "@radix-ui/react-switch";

type Props = {};

const BreadCrumb = (props: Props) => {

  const { chatRoom, expand, loading, onActivateRealTime, onExpand, onSignOut, page, realtime } = useSideBar()
  return (
    <div className="flex flex-col">
      <div className="flex gap-5 items-center">
        <h2 className="text-3xl font-bold capitalize">{page}</h2>
        {page === 'conversaciones' && chatRoom && (
          <Loader loading={loading} className="p-0 inline">
            <Switch
              defaultChecked={realtime}
              onClick={(e) => onActivateRealTime(e)}
              className="data-[state=checked]:bg-orange data-[state=unchacked]:bg-peach"></Switch>
          </Loader>
        )}
      </div>

      <p className="text-gray-500 text-sm">
        {page == 'configuraciones'
          ? 'Gestiona tus configuraciones, preferencias y integraciones'
          : page == 'dashboard'
            ? 'Un resumen detallado de tus métricas, uso, clientes y más'
            : page == 'citas'
              ? 'Ver y editar todos tus citas'
              : page == 'email-marketing'
                ? 'Envía correos masivos a tus clientes'
                : page == 'integraciones'
                  ? 'Conecta aplicaciones de terceros a Lunari-AI'
                  : 'Modifica configuraciones de empresa, cambia opciones del chatbot, ingresa preguntas de ventas y entrena a tu bot para que haga lo que quieras.'}
      </p>

    </div>
  );
};

export default BreadCrumb;
