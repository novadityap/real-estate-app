'use client';

import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { useListRolesQuery } from '@/services/roleApi';
import {
  useShowUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} from '@/services/userApi';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/shadcn/avatar';
import useFormHandler from '@/hooks/useFormHandler';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from '@/components/shadcn/select';
import {
  Form,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
  FormControl,
} from '@/components/shadcn/form';
import { useEffect } from 'react';
import { TbLoader } from 'react-icons/tb';
import { Skeleton } from '@/components/shadcn/skeleton';

const UserFormSkeleton = ({ isCreate }) => (
  <div className="space-y-4">
    {!isCreate && (
      <div className="flex justify-center">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    )}
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-10 w-full" />
    <div className="flex justify-end gap-2">
      <Skeleton className="h-10 w-24 rounded-md" />
      <Skeleton className="h-10 w-24 rounded-md" />
    </div>
  </div>
);

const UserForm = ({id, onSubmitComplete, onCancel, isCreate}) => {
  const { data: user, isLoading: isUserLoading } = useShowUserQuery(id, {
      skip: isCreate || !id
    });
  const { data: roles, isLoading: isRolesLoading } = useListRolesQuery();
  const { form, handleSubmit, isLoading } = useFormHandler({
    fileFieldname: 'avatar',
    isCreate,
    mutation: isCreate ? useCreateUserMutation : useUpdateUserMutation,
    onSubmitComplete,
    defaultValues: {
      username: '',
      email: '',
      password: '',
      roleId: '',
    },
    ...(!isCreate && { 
      params: [{ name: 'userId', value: id }],
    }),
  });

  useEffect(() => {
    if (!isCreate && user?.data && roles?.data?.length > 0) {
      form.reset({
        username: user.data.username,
        email: user.data.email,
        roleId: user.data.roleId,
        password: ''
      });
    }
  }, [user, roles]);

  if (isUserLoading || isRolesLoading)
    return <UserFormSkeleton isCreate={isCreate} />;

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {!isCreate && (
          <>
            <div className="flex justify-center">
              <Avatar className="size-32">
                <AvatarImage
                  src={user?.data?.avatar}
                  fallback={
                    <AvatarFallback>
                      {user?.data?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  }
                />
              </Avatar>
            </div>
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={e => field.onChange(e.target.files[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select 
                key={field.value}
                value={field.value} 
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles?.data?.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-x-2">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <TbLoader className="animate-spin" />
                {isCreate ? 'Creating..' : 'Updating..'}
              </>
            ) : isCreate ? (
              'Create'
            ) : (
              'Update'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UserForm;
