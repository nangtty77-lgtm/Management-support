import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { SearchProvider } from '@/components/search/SearchProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 max-w-[1200px] mx-auto w-full">{children}</main>
        </div>
      </div>
    </SearchProvider>
  )
}
