import { getOrderById, getOrderTotal, type OrderStatus } from "@/lib/orders"
import { formatCurrency } from "@/lib/utils"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UpdateOrderStatusForm } from "@/components/update-order-status-form"

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id)

  if (!order) {
    notFound()
  }

  // Get the order total using our helper function
  const orderTotal = await getOrderTotal(order)

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <Link href="/admin/orders" className="text-blue-600 hover:underline">
          Back to Orders
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Order #{order.id.substring(0, 8)}</CardTitle>
                <CardDescription>Placed on {new Date(order.created_at).toLocaleString()}</CardDescription>
              </div>
              <Badge
                className={`${getStatusColor(order.status)} text-xs px-2 py-1 rounded-full uppercase font-semibold`}
              >
                {order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Product
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Price
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Quantity
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 relative">
                                <Image
                                  src={item.product_image || "/placeholder.svg"}
                                  alt={item.product_name}
                                  fill
                                  className="rounded-md object-cover"
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                <div className="text-sm text-gray-500">ID: {item.product_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <th
                          scope="row"
                          colSpan={3}
                          className="px-6 py-3 text-right text-sm font-semibold text-gray-900"
                        >
                          Total
                        </th>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(orderTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {order.shipping_address && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Shipping Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Name:</span> {order.shipping_address.name}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Address:</span> {order.shipping_address.address}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">City:</span> {order.shipping_address.city}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Postal Code:</span> {order.shipping_address.postal_code}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Country:</span> {order.shipping_address.country}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Phone:</span> {order.shipping_address.phone}
                    </p>
                  </div>
                </div>
              )}

              {order.status_history && order.status_history.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Status History</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-3">
                      {order.status_history.map((history, index) => (
                        <li key={index} className="flex items-start">
                          <div
                            className={`mt-1 mr-3 flex-shrink-0 w-2 h-2 rounded-full ${getStatusDotColor(
                              history.status,
                            )}`}
                          ></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Status changed to{" "}
                              <span className={getStatusTextColor(history.status)}>{history.status}</span>
                            </p>
                            <p className="text-xs text-gray-500">{new Date(history.timestamp).toLocaleString()}</p>
                            {history.note && <p className="text-sm text-gray-700 mt-1">{history.note}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Order</CardTitle>
            <CardDescription>Change the status of this order</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateOrderStatusForm orderId={order.id} currentStatus={order.status} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "processing":
      return "bg-blue-100 text-blue-800"
    case "shipped":
      return "bg-purple-100 text-purple-800"
    case "delivered":
      return "bg-green-100 text-green-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getStatusTextColor(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "text-yellow-800"
    case "processing":
      return "text-blue-800"
    case "shipped":
      return "text-purple-800"
    case "delivered":
      return "text-green-800"
    case "cancelled":
      return "text-red-800"
    default:
      return "text-gray-800"
  }
}

function getStatusDotColor(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-yellow-500"
    case "processing":
      return "bg-blue-500"
    case "shipped":
      return "bg-purple-500"
    case "delivered":
      return "bg-green-500"
    case "cancelled":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}
