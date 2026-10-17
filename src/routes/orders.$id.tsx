import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/orders/$id')({
  component: OrderConfirmationPage,
})

function OrderConfirmationPage() {
  return null
}
