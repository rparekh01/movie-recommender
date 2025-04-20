import { useRouter } from "next/navigation";
import { useState } from "react";
import { Form, useForm } from "react-hook-form";
import { signIn } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../form";
import { Input } from "../input";
import { Button } from "../button";
import Link from "next/link";


const formSchema = z.object({
    email:z.string().email({
        message:"Please enter a valid email address."
    }),
    password: z.string().min(6,{
        message: "Password must be at least 6 characters."
    })
})


export function LoginForm(){
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          email: "",
          password: "",
        },
      });

      async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)
    
        try {
          const result = await signIn("credentials", {
            redirect: false,
            email: values.email,
            password: values.password,
          })
    
          if (result?.error) {
            setError("Invalid email or password")
            setIsLoading(false)
            return
          }
    
          router.refresh()
          router.push("/")
        } catch (error) {
          setError("An error occurred. Please try again.")
          console.error("Login error:", error)
          setIsLoading(false)
        }
      }

      return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="email"
            render={({field}) =>(
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input placeholder="email@example.com" {...field} type="email" disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <div className="text-sm font-medium text-destructive mt-2">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </CardFooter>

        </Card>
      )
}