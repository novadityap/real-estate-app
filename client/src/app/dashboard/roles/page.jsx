'use client';

import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/ui/DataTable';
import {
  useSearchRolesQuery,
  useRemoveRoleMutation,
} from '@/services/roleApi';
import RoleForm from '@/components/ui/RoleForm';
import BreadcrumbNav from '@/components/ui/BreadcrumbNav';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import AuthGuard from '@/components/auth/AuthGuard';

const Role = () => {
  const columnHelper = createColumnHelper();
  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      size: 100,
    }),
  ];

  return (
    <AuthGuard requiredRoles={['admin']}>
      <BreadcrumbNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800">Roles</CardTitle>
          <CardDescription>Manage roles</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            searchQuery={useSearchRolesQuery}
            removeMutation={useRemoveRoleMutation}
            FormComponent={RoleForm}
            entityName="role"
          />
        </CardContent>
      </Card>
    </AuthGuard>
  );
};
export default Role;
