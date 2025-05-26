// app/admin/orders/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react" // Added useMemo
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image";
import { Leaf, Package, LogOut, BarChart3, Settings, ShoppingBag, ArrowLeft, Menu, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react" // Added Menu and sorting icons
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { OrderStatus } from "@/lib/orders" // Assuming OrderStatus is exported
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

interface DisplayOrder {
  id: string;
  user_id: string;
  customer_name?: string;
  customer_email?: string;
  created_at: string;
  total_amount: number;
  status: OrderStatus;
}

// Define SortConfig type (can be reused or defined per page if specific)
type SortConfig<T> = {
  key: keyof T;
  direction: 'ascending' | 'descending';
} | null;

export default function AdminOrdersPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<DisplayOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for sorting orders
  const [orderSortConfig, setOrderSortConfig] = useState<SortConfig<DisplayOrder>>({ key: 'created_at', direction: 'descending' });


  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, user_id, created_at, total_amount, status, customer_name, customer_email")
          .order("created_at", { ascending: false }) // Initial fetch order, client-side sort will override

        if (error) {
          console.error("Error fetching orders:", error)
          setOrders([]) 
          return
        }
        
        if (data) {
            setOrders(data as DisplayOrder[]);
        } else {
            setOrders([]);
        }

      } catch (error) {
        console.error("Error fetching orders:", error)
        setOrders([]) 
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Sorting logic for orders
   const sortedOrders = useMemo(() => {
    let sortableItems = [...orders];
    if (orderSortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[orderSortConfig.key as keyof DisplayOrder];
        const valB = b[orderSortConfig.key as keyof DisplayOrder];
        let comparison = 0;

        if (orderSortConfig.key === 'created_at') {
          comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = (valA || "").localeCompare(valB || "");
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        }
        
        return orderSortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [orders, orderSortConfig]);

  const requestOrderSort = (key: keyof DisplayOrder) => {
    let currentDirection = orderSortConfig?.direction;
    let nextDirection: 'ascending' | 'descending';

    if (orderSortConfig && orderSortConfig.key === key) {
      nextDirection = currentDirection === 'ascending' ? 'descending' : 'ascending';
    } else {
      // Default sort directions for different keys
      switch (key) {
        case 'id':
        case 'customer_name':
        case 'customer_email':
        case 'status':
          nextDirection = 'ascending';
          break;
        case 'created_at':
        case 'total_amount':
          nextDirection = 'descending';
          break;
        default:
          nextDirection = 'ascending';
      }
    }
    setOrderSortConfig({ key, direction: nextDirection });
  };
  
  const getSortIndicatorIcon = <T,>(key: keyof T, sortConfig: SortConfig<T>) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30 flex-shrink-0" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-1 h-3 w-3 flex-shrink-0" />;
    }
    return <ArrowDown className="ml-1 h-3 w-3 flex-shrink-0" />;
  };


  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }
  
  const adminNavLinks = [
    { href: "/admin/dashboard", label: "Produk", icon: Package },
    { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag },
    { href: "/admin/analytics", label: "Analitik", icon: BarChart3 },
    { href: "/admin/settings", label: "Pengaturan", icon: Settings },
  ];

  const headerCellClass = "h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:bg-muted/50";


  return (
    <ProtectedRoute adminOnly>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="hidden md:flex w-64 flex-col bg-background border-r dark:border-gray-800">
          <div className="flex h-16 items-center border-b dark:border-gray-800 px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Leaf className="h-6 w-6 text-green-600 dark:text-green-500" />
              <span className="text-xl">BenihKu</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
              {adminNavLinks.map(link => {
                const Icon = link.icon;
                const isActive = router.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-all ${
                        isActive ? "bg-accent text-accent-foreground" : ""
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)} 
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
               })}
            </nav>
          </div>
          <div className="border-t dark:border-gray-800 p-4">
             {user && (
                <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-2">
                   {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url as string}
                      alt={user.user_metadata.name || user.email || "User Avatar"}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {(user.user_metadata?.name || user.email || "A").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium truncate max-w-[150px]">{user.user_metadata?.name || user.email}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                  </div>
                </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground mt-2"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b dark:border-gray-800 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            <div className="flex items-center">
              <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Buka Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[260px] p-0">
                    <SheetHeader className="p-4 border-b dark:border-gray-800">
                      <SheetTitle>
                          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                              <Leaf className="h-6 w-6 text-green-600 dark:text-green-500" />
                              <span className="text-xl">BenihKu Admin</span>
                          </Link>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-auto py-2 p-4">
                      <nav className="grid items-start text-sm font-medium gap-1">
                       {adminNavLinks.map(link => {
                        const Icon = link.icon;
                        const isActive = router.pathname === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-all ${
                                isActive ? "bg-accent text-accent-foreground" : ""
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Icon className="h-4 w-4" />
                            {link.label}
                          </Link>
                        );
                       })}
                      </nav>
                    </div>
                    <Separator className="my-2" />
                     <div className="p-4 border-t dark:border-gray-800">
                          {user && (
                              <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-2">
                                {user.user_metadata?.avatar_url ? (
                                  <Image
                                    src={user.user_metadata.avatar_url as string}
                                    alt={user.user_metadata.name || user.email || "User Avatar"}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                        {(user.user_metadata?.name || user.email || "A").charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                  <div>
                                  <p className="text-sm font-medium truncate max-w-[150px]">{user.user_metadata?.name || user.email}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                                  </div>
                              </div>
                          )}
                          <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => {
                              handleLogout();
                              setIsMobileMenuOpen(false);
                          }}
                          >
                          <LogOut className="mr-2 h-4 w-4" />
                          Keluar
                          </Button>
                      </div>
                  </SheetContent>
                </Sheet>
              </div>
              <h1 className="text-lg font-semibold md:text-xl ml-2 md:ml-0">Manajemen Pesanan</h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <ThemeToggle />
            </div>
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 md:gap-8 md:p-8">
             <div className="hidden md:flex items-center gap-4">
                 <Link href="/admin/dashboard">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Dashboard
                    </Button>
                 </Link>
             </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Tidak ada pesanan yang ditemukan.</p>
              </div>
            ) : (
              <div className="rounded-md border dark:border-gray-800">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b dark:border-gray-800">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted dark:border-gray-800">
                        <th className={headerCellClass} onClick={() => requestOrderSort('id')}>
                            <div className="flex items-center">ID {getSortIndicatorIcon('id', orderSortConfig)}</div>
                        </th>
                        <th className={headerCellClass} onClick={() => requestOrderSort('created_at')}>
                            <div className="flex items-center">Tanggal {getSortIndicatorIcon('created_at', orderSortConfig)}</div>
                        </th>
                        <th className={headerCellClass} onClick={() => requestOrderSort('customer_name')}>
                            <div className="flex items-center">Pelanggan {getSortIndicatorIcon('customer_name', orderSortConfig)}</div>
                        </th>
                        <th className={headerCellClass} onClick={() => requestOrderSort('total_amount')}>
                            <div className="flex items-center">Total {getSortIndicatorIcon('total_amount', orderSortConfig)}</div>
                        </th>
                        <th className={headerCellClass} onClick={() => requestOrderSort('status')}>
                            <div className="flex items-center">Status {getSortIndicatorIcon('status', orderSortConfig)}</div>
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">{
                      sortedOrders.map((order) => (
                        <tr key={order.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted dark:border-gray-800">
                          <td className="p-4 align-middle font-mono text-xs">{order.id.substring(0, 8)}...</td>
                          <td className="p-4 align-middle">{format(new Date(order.created_at), "dd MMM yyyy HH:mm")}</td>
                          <td className="p-4 align-middle">{order.customer_name || order.customer_email || order.user_id.substring(0,8)+"..."}</td>
                          <td className="p-4 align-middle font-medium">Rp {order.total_amount.toLocaleString("id-ID")}</td>
                          <td className="p-4 align-middle">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex gap-2">
                              <Link href={`/admin/orders/${order.id}`}>
                                <Button variant="outline" size="sm">Detail</Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    }</tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
