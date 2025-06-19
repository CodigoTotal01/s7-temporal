import { onGetBlogPosts } from '@/action/landing'
import NavBar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { pricingCards } from '@/constants/landing-page'
import clsx from 'clsx'
import { ArrowRightCircleIcon, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default async function Home() {

  const posts:
    | {
      id: string
      title: string
      image: string
      content: string
      createdAt: Date
    }[]
    | undefined = await onGetBlogPosts()
  return (
    <main>
      <NavBar />
      <section>
        <div
          className="flex items-center justify-center flex-col mt-[80px]
        gap-4"
        >
          <span
            className="text-orange bg-orange/20 px-4 py-2 rounded-full
          text-sm"
          >
            Un chatbot asistente de ventas impulsado por IA
          </span>
          <Image
            src="/images/corinna-ai-logo.png"
            width={500}
            height={100}
            alt="logo"
            className="max-w-lg object-contain"
          />
          <p className="text-center max-w-[500px]">
            ¡Tu asistente de ventas impulsado por IA! ¡Incorpora Kobu AI en
            cualquier sitio web con solo un fragmento de código!
          </p>
          <Button className="bg-orange font-bold text-white px-4">
            Comienza Gratis
          </Button>
          <Image
            src="/images/iphonecorinna.png"
            width={400}
            height={100}
            alt="Logo"
            className="max-w-lg object-contain"
          />
        </div>
      </section>
      <section className="flex justify-center items-center flex-col gap-4 mt-10">
        <h2 className="text-4xl text-center">Elige lo que mejor se adapte a ti</h2>
        <p className="text-muted-foreground text-center max-w-lg">
          Nuestros planes de precios sencillos están diseñados para satisfacer tus necesidades. Si no estás listo para comprometerte, puedes comenzar gratis.
        </p>
      </section>
      <div className="flex justify-center gap-4 flex-wrap mt-6">
        {pricingCards.map((card) => (
          <Card
            key={card.title}
            className={clsx("w-[300px] flex flex-col justify-between", {
              "border-2 border-primary": card.title === "Ilimitado",
            })}
          >
            <CardHeader>
              <CardTitle className="text-orange">{card.title}</CardTitle>
              <CardDescription>
                {pricingCards.find((c) => c.title === card.title)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-4xl font-bold">{card.price}</span>
              <span className="text-muted-foreground">
                <span>/ mes</span>
              </span>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              <div>
                {card.features.map((feature) => (
                  <div key={feature} className="flex gap-2">
                    <Check />
                    <p>{feature}</p>
                  </div>
                ))}
              </div>
              <Link
                href={`/dashboard?plan=${card.title}`}
                className="bg-[#f3d299] border-orange border-2 p-2 w-full
                text-center font-bold rounded-md"
              >
                Comenzar
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
