import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const stripeRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' });

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || 'price_placeholder';

// POST /api/stripe/checkout — Create checkout session
stripeRouter.post('/checkout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const orgId = req.user!.orgId!;
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { orgId } });
      customerId = customer.id;
      await prisma.organization.update({ where: { id: orgId }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/settings`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/webhook — Handle Stripe events
stripeRouter.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch {
    return res.status(400).json({ error: 'Webhook signature invalid' });
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const org = await prisma.organization.findUnique({ where: { stripeCustomerId: customerId } });
    if (org) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          plan: sub.status === 'active' ? 'PRO' : 'FREE',
          stripeSubscriptionId: sub.id,
        },
      });
    }
  }

  res.json({ received: true });
});

import express from 'express';
