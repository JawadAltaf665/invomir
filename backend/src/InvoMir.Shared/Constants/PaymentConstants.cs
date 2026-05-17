namespace InvoMir.Shared.Constants;

public static class PaymentConstants
{
    public static class Methods
    {
        public const string Cash = "cash";
        public const string BankTransfer = "bank_transfer";
        public const string Cheque = "cheque";
        public const string Other = "other";
        public const string Card = "card";

        public static readonly string[] Manual =
        [
            Cash,
            BankTransfer,
            Cheque,
            Other
        ];
    }

    public static class Statuses
    {
        public const string Completed = "completed";
        public const string Failed = "failed";
        public const string Refunded = "refunded";
    }
}
