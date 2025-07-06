import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/shadcn/alert.jsx';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/shadcn/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/shadcn/form';
import { TbLoader, TbCircleCheck } from 'react-icons/tb';
import useFormHandler from '@/hooks/useFormHandler';
import { useRequestResetPasswordMutation } from '@/services/authApi';

const ResetPasswordRequest = () => {
  const { form, handleSubmit, isLoading, isSuccess, message } =
    useFormHandler({
      mutation: useRequestResetPasswordMutation,
      defaultValues: {
        email: '',
      },
    });

  return (
    <Card className="w-full sm:w-[450px]">
      <CardHeader>
        <CardTitle className="text-heading">Request Reset Password</CardTitle>
        <CardDescription>
          Enter your email and we will send you a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess && (
          <Alert variant="success">
            <TbCircleCheck className="size-5 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <TbLoader className="animate-spin mr-2 size-5" />
                  Loading...
                </>
              ) : (
                'Request Reset Password'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordRequest;
