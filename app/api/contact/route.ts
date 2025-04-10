import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const { name, email, subject, message, to } = body

    // Validate inputs
    if (!name || !email || !subject || !message || !to) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a transporter using the provided email credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Uses Gmail's predefined settings
      auth: {
        user: process.env.EMAIL_USER, // from .env.local
        pass: process.env.EMAIL_PASS, // from .env.local (App Password)
      },
      tls: {
        rejectUnauthorized: false // Helps avoid certificate issues
      }
    })

    // Format email content
    const mailOptions = {
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Portfolio Contact: ${subject}`,
      replyTo: email, // Makes it easy to reply directly to the sender
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 20px;">
            <p><strong>Message:</strong></p>
            <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This email was sent from your portfolio contact form.
          </p>
        </div>
      `,
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully' 
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { message: 'Failed to send email' },
      { status: 500 }
    )
  }
} 