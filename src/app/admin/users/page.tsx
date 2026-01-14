import { getPaginatedUsers } from "@/actions/admin"
import { UsersTable } from "./users-table"

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const { data } = await getPaginatedUsers(100)
  const users = data?.users || []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <UsersTable users={users as any} total={data?.total || 0} />
    </div>
  )
}
