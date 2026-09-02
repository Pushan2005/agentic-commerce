- abstract away payment handling to

```ts
interface PaymentProvider {
    createPayment(...)
    getPayment(...)
    capturePayment(...) // not sure if required
    refundPayment(...)
}
```
