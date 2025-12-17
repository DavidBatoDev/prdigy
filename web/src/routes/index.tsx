import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/homepage/Header'
import Hero from '@/components/homepage/Hero'
import About from '@/components/homepage/About'
import Stats from '@/components/homepage/Stats'
import Services from '@/components/homepage/Services'
import References from '@/components/homepage/References'
import CTA from '@/components/homepage/CTA'
import Footer from '@/components/homepage/Footer'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="text-center">
      <Header />
      <Hero />
      <About />
      <Stats />
      <Services />
      <References />
      <CTA />
      <Footer />
    </div>
  )
}
