'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Testimonial {
  content: string
  author: string
  role: string
  image: string
}

const testimonials: Testimonial[] = [
  {
    content: "Jordan's ability to capture our brand's energy and translate it into a visually dynamic, user-friendly website was nothing short of amazing. The slick motion graphics and e-commerce align perfectly with our social media-driven approach, making it easy for us to engage our customers. Jordan gave us the platform we needed to grow Off The Leash Lifestyle and expand our offerings.",
    author: "Paddy Gleason",
    role: "Professional Paintball Player & Founder of Off The Leash Lifestyle",
    image: "/testimonials/paddy-headshot.jpg"
  },
  {
    content: "Working with Jordan on Swyvvl's website has been a game changer for our business. He not only delivered a sleek, user-friendly platform, but also implemented systems to streamline our operations and improve our digital presence. His understanding of the user experience, paired with a sharp eye for design, made all the difference.",
    author: "Rob Brower",
    role: "CTO of Swyvvl & CEO of Aletheia Digital Media",
    image: "/testimonials/rob-headshot.jpg"
  },
  {
    content: "Jordan created a website for my clinic that truly reflects our brand. His design is clean, professional, and easy for our patients to navigate. Since launching the site, we've seen a noticeable increase in both online traffic and new patient inquiries. His work has significantly impacted our business growth.",
    author: "Dr. Brett Petrilli",
    role: "Doctor & Owner of Chiropractic Healthcare",
    image: "/testimonials/brett-headshot.jpg"
  }
]

export function Testimonials() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
            Client Testimonials
          </h2>
          <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
            Hear what my clients have to say about their experience working with me.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                  <p className="text-sm/relaxed text-gray-500 dark:text-gray-400">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.image} alt={testimonial.author} />
                      <AvatarFallback>{testimonial.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{testimonial.author}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 