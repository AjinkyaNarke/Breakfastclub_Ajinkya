import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReservationEmailRequest {
  reservation: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    reservation_date: string;
    reservation_time: string;
    party_size: number;
    special_requests?: string;
    status: string;
  };
  language: string;
}

const getEmailContent = (reservation: any, language: string) => {
  const isGerman = language === 'de';
  
  const content = {
    subject: isGerman 
      ? "Reservierungsbestätigung - My Fcking Breakfast Club"
      : "Reservation Confirmation - My Fcking Breakfast Club",
    
    customerTitle: isGerman 
      ? "Vielen Dank für Ihre Reservierung!"
      : "Thank you for your reservation!",
    
    customerMessage: isGerman
      ? "Wir haben Ihre Reservierung erhalten und werden sie in Kürze bearbeiten. Sie erhalten eine weitere E-Mail, sobald Ihre Reservierung bestätigt wurde."
      : "We have received your reservation and will process it shortly. You will receive another email once your reservation is confirmed.",
    
    adminSubject: isGerman
      ? "Neue Reservierung eingegangen - My Fcking Breakfast Club"
      : "New Reservation Received - My Fcking Breakfast Club",
    
    details: {
      name: isGerman ? "Name" : "Name",
      email: isGerman ? "E-Mail" : "Email", 
      phone: isGerman ? "Telefon" : "Phone",
      date: isGerman ? "Datum" : "Date",
      time: isGerman ? "Uhrzeit" : "Time",
      guests: isGerman ? "Anzahl Gäste" : "Number of Guests",
      requests: isGerman ? "Besondere Wünsche" : "Special Requests",
      status: isGerman ? "Status" : "Status"
    },
    
    statusText: {
      pending: isGerman ? "Ausstehend" : "Pending",
      confirmed: isGerman ? "Bestätigt" : "Confirmed",
      cancelled: isGerman ? "Storniert" : "Cancelled"
    }
  };
  
  return content;
};

const formatDate = (dateString: string, language: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const createCustomerEmailHtml = (reservation: any, content: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
    .details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f3f4; }
    .detail-row:last-child { border-bottom: none; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #2563eb; margin: 0;">My Fcking Breakfast Club</h1>
      <h2 style="margin: 10px 0 0 0;">${content.customerTitle}</h2>
    </div>
    
    <p>${content.customerMessage}</p>
    
    <div class="details">
      <h3 style="margin-top: 0;">Reservation Details</h3>
      <div class="detail-row">
        <strong>${content.details.name}:</strong>
        <span>${reservation.customer_name}</span>
      </div>
      <div class="detail-row">
        <strong>${content.details.email}:</strong>
        <span>${reservation.customer_email}</span>
      </div>
      ${reservation.customer_phone ? `
      <div class="detail-row">
        <strong>${content.details.phone}:</strong>
        <span>${reservation.customer_phone}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <strong>${content.details.date}:</strong>
        <span>${formatDate(reservation.reservation_date, content.details.name === 'Name' ? 'en' : 'de')}</span>
      </div>
      <div class="detail-row">
        <strong>${content.details.time}:</strong>
        <span>${reservation.reservation_time}</span>
      </div>
      <div class="detail-row">
        <strong>${content.details.guests}:</strong>
        <span>${reservation.party_size}</span>
      </div>
      ${reservation.special_requests ? `
      <div class="detail-row">
        <strong>${content.details.requests}:</strong>
        <span>${reservation.special_requests}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <strong>${content.details.status}:</strong>
        <span style="color: #f59e0b;">${content.statusText[reservation.status as keyof typeof content.statusText]}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>My Fcking Breakfast Club<br>
      Berlin, Germany<br>
      Email: info@myfckingbreakfastclub.com</p>
    </div>
  </div>
</body>
</html>
`;

const createAdminEmailHtml = (reservation: any, content: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
    .details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f3f4; }
    .detail-row:last-child { border-bottom: none; }
    .urgent { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">New Reservation Alert</h1>
      <p style="margin: 10px 0 0 0;">My Fcking Breakfast Club</p>
    </div>
    
    <div class="urgent">
      <strong>Action Required:</strong> A new reservation has been submitted and requires confirmation.
    </div>
    
    <div class="details">
      <h3 style="margin-top: 0;">Reservation Details</h3>
      <div class="detail-row">
        <strong>Reservation ID:</strong>
        <span>${reservation.id}</span>
      </div>
      <div class="detail-row">
        <strong>Customer Name:</strong>
        <span>${reservation.customer_name}</span>
      </div>
      <div class="detail-row">
        <strong>Email:</strong>
        <span>${reservation.customer_email}</span>
      </div>
      ${reservation.customer_phone ? `
      <div class="detail-row">
        <strong>Phone:</strong>
        <span>${reservation.customer_phone}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <strong>Date:</strong>
        <span>${formatDate(reservation.reservation_date, 'en')}</span>
      </div>
      <div class="detail-row">
        <strong>Time:</strong>
        <span>${reservation.reservation_time}</span>
      </div>
      <div class="detail-row">
        <strong>Party Size:</strong>
        <span>${reservation.party_size} guests</span>
      </div>
      ${reservation.special_requests ? `
      <div class="detail-row">
        <strong>Special Requests:</strong>
        <span>${reservation.special_requests}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <strong>Status:</strong>
        <span style="color: #f59e0b; font-weight: bold;">PENDING CONFIRMATION</span>
      </div>
    </div>
    
    <p><strong>Next Steps:</strong></p>
    <ol>
      <li>Log into the admin panel to review this reservation</li>
      <li>Confirm or modify the reservation details</li>
      <li>The customer will receive an automatic confirmation email</li>
    </ol>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  console.log("Reservation confirmation email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservation, language }: ReservationEmailRequest = await req.json();
    console.log("Processing reservation email for:", reservation.customer_email);

    const content = getEmailContent(reservation, language);

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "My Fcking Breakfast Club <info@myfckingbreakfastclub.com>",
      to: [reservation.customer_email],
      subject: content.subject,
      html: createCustomerEmailHtml(reservation, content),
    });

    console.log("Customer email sent successfully:", customerEmailResponse);

    // Send notification email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Reservations <info@myfckingbreakfastclub.com>",
      to: ["einfachlami@gmail.com"],
      subject: content.adminSubject,
      html: createAdminEmailHtml(reservation, content),
    });

    console.log("Admin email sent successfully:", adminEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerEmailId: customerEmailResponse.id,
        adminEmailId: adminEmailResponse.id 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reservation-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);