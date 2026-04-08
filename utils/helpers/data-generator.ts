import { faker } from '@faker-js/faker';

/**
 * Test Data Generator
 * Generates realistic test data for various scenarios
 */
export class TestDataGenerator {
  /**
   * Generate random user with credentials
   */
  static generateUser(): {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  } {
    return {
      email: faker.internet.email(),
      password: `${faker.string.alphaNumeric(10)}Aa1!`,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    };
  }

  /**
   * Generate valid email
   */
  static generateEmail(): string {
    return faker.internet.email();
  }

  /**
   * Generate strong password
   */
  static generatePassword(): string {
    return faker.string.alphaNumeric(12) + 'Aa1!';
  }

  /**
   * Generate phone number
   */
  static generatePhoneNumber(): string {
    return faker.phone.number('+1-###-###-####');
  }

  /**
   * Generate formatted address
   */
  static generateAddress(): {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } {
    return {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode(),
      country: faker.location.country(),
    };
  }

  /**
   * Generate credit card (dummy - for testing only)
   */
  static generateCreditCard(): {
    number: string;
    expiration: string;
    cvv: string;
  } {
    return {
      number: faker.finance.creditCardNumber(),
      expiration: faker.date.future().toLocaleDateString(),
      cvv: faker.string.numeric(3),
    };
  }

  /**
   * Generate random product data
   */
  static generateProduct(): {
    name: string;
    description: string;
    price: number;
    sku: string;
  } {
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price()),
      sku: faker.string.alphaNumeric(10).toUpperCase(),
    };
  }

  /**
   * Generate random job/role
   */
  static generateJob(): {
    title: string;
    company: string;
  } {
    return {
      title: faker.person.jobTitle(),
      company: faker.company.name(),
    };
  }

  /**
   * Generate random UUID
   */
  static generateUUID(): string {
    return faker.string.uuid();
  }

  /**
   * Generate random slug
   */
  static generateSlug(): string {
    return faker.slug();
  }

  /**
   * Generate future date
   */
  static generateFutureDate(): Date {
    return faker.date.future();
  }

  /**
   * Generate past date
   */
  static generatePastDate(): Date {
    return faker.date.past();
  }
}

export default TestDataGenerator;
