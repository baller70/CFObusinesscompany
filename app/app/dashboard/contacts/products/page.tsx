

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Package, Wrench, DollarSign, TrendingUp, BarChart3 } from 'lucide-react'
import Link from 'next/link'

import { BackButton } from '@/components/ui/back-button';
async function getProductsServicesData(userId: string) {
  const [products, services, productStats, serviceStats] = await Promise.all([
    prisma.product.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: {
        invoiceItems: {
          select: { quantity: true, amount: true }
        },
        estimateItems: {
          select: { quantity: true, amount: true }
        }
      }
    }),
    prisma.service.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: {
        invoiceItems: {
          select: { quantity: true, amount: true }
        },
        estimateItems: {
          select: { quantity: true, amount: true }
        }
      }
    }),
    prisma.product.groupBy({
      by: ['isActive', 'category'],
      where: { userId },
      _count: { _all: true },
      _avg: { price: true }
    }),
    prisma.service.groupBy({
      by: ['isActive', 'category'],
      where: { userId },
      _count: { _all: true },
      _avg: { rate: true }
    })
  ])

  const activeProducts = productStats.filter(s => s.isActive === true).reduce((sum, s) => sum + s._count._all, 0)
  const activeServices = serviceStats.filter(s => s.isActive === true).reduce((sum, s) => sum + s._count._all, 0)
  const avgProductPrice = productStats.find(s => s.isActive === true)?._avg.price || 0
  const avgServiceRate = serviceStats.find(s => s.isActive === true)?._avg.rate || 0

  return { 
    products, 
    services, 
    activeProducts, 
    activeServices, 
    avgProductPrice, 
    avgServiceRate 
  }
}

export default async function ProductsServicesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { 
    products, 
    services, 
    activeProducts, 
    activeServices, 
    avgProductPrice, 
    avgServiceRate 
  } = await getProductsServicesData(session.user.id)

  const totalRevenue = [...products, ...services].reduce((sum, item) => {
    const itemRevenue = item.invoiceItems?.reduce((itemSum: number, invoice: any) => itemSum + invoice.amount, 0) || 0
    return sum + itemRevenue
  }, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
        <BackButton href="/dashboard" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-gray-600 mt-1">Inventory and service catalog management</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/dashboard/contacts/products/services/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </Link>
          <Link href="/dashboard/contacts/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold text-blue-600">{activeProducts}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">In catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Wrench className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold text-green-600">{activeServices}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Product Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${avgProductPrice.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Average pricing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">From sales</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">SKU</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Price</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Cost</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Margin</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const margin = product.cost ? ((product.price - product.cost) / product.price * 100) : 0
                        const totalSales = product.invoiceItems?.reduce((sum: number, item: any) => sum + (item.quantity * item.amount), 0) || 0

                        return (
                          <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-semibold text-gray-900">{product.name}</div>
                                {product.description && (
                                  <div className="text-sm text-gray-600 truncate max-w-xs">
                                    {product.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm font-mono">
                              {product.sku || '-'}
                            </td>
                            <td className="py-3 px-4">
                              {product.category && (
                                <Badge variant="outline">{product.category}</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">
                              ${product.price.toLocaleString()}
                              {product.unit && <span className="text-xs text-gray-500">/{product.unit}</span>}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600">
                              {product.cost ? `$${product.cost.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {product.cost ? (
                                <span className={`font-medium ${margin > 20 ? 'text-green-600' : margin > 10 ? 'text-gray-600' : 'text-red-600'}`}>
                                  {margin.toFixed(1)}%
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-600 mb-4">Add products to track inventory and margins</p>
                  <Link href="/dashboard/contacts/products/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => {
                    const totalRevenue = service.invoiceItems?.reduce((sum: number, item: any) => sum + (item.quantity * item.amount), 0) || 0
                    const totalHours = service.invoiceItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0

                    return (
                      <Card key={service.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                            <Badge variant={service.isActive ? 'default' : 'secondary'}>
                              {service.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {service.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {service.description}
                            </p>
                          )}

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Rate:</span>
                              <span className="font-semibold">
                                ${service.rate.toLocaleString()} per {service.unit}
                              </span>
                            </div>
                            {service.category && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Category:</span>
                                <Badge variant="outline">{service.category}</Badge>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Taxable:</span>
                              <span className={`text-sm ${service.taxable ? 'text-green-600' : 'text-gray-500'}`}>
                                {service.taxable ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>

                          {totalRevenue > 0 && (
                            <div className="pt-3 border-t border-gray-100">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Total Revenue:</span>
                                <span className="font-semibold text-green-600">${totalRevenue.toLocaleString()}</span>
                              </div>
                              {totalHours > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">Hours Billed:</span>
                                  <span className="font-medium">{totalHours}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-end mt-4">
                            <Button variant="outline" size="sm">
                              Edit Service
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
                  <p className="text-gray-600 mb-4">Add services to your catalog for billing</p>
                  <Link href="/dashboard/contacts/products/services/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Product Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Analytics coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Product Sales:</span>
                    <span className="font-semibold">
                      ${products.reduce((sum, p) => sum + (p.invoiceItems?.reduce((itemSum: number, item: any) => itemSum + item.amount, 0) || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Service Revenue:</span>
                    <span className="font-semibold">
                      ${services.reduce((sum, s) => sum + (s.invoiceItems?.reduce((itemSum: number, item: any) => itemSum + item.amount, 0) || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Revenue:</span>
                      <span className="font-bold text-lg">${totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
