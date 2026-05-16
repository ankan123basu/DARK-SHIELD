# 🛡️ DARKSHIELD — VIVA PREPARATION GUIDE

This document contains everything you need to know to defend your project during your Viva. It breaks down the architecture, layers, annotations, security, and data flow of the DarkShield Spring Boot backend.

---

## 1. 🏗️ THE 3-TIER ARCHITECTURE (LAYERS)
Our Spring Boot backend follows the classic **Model-View-Controller (MVC) / 3-Tier Architecture**. This separates concerns so the code is clean, scalable, and easy to maintain.

### A. Controller Layer (The Doorman)
*   **Location**: `src/main/java/com/darkshield/controller`
*   **Purpose**: This is the entry point for the frontend (React). It receives HTTP requests (GET, POST, PUT, DELETE), reads the incoming JSON payload, calls the Service layer to do the actual work, and then returns an HTTP Response (like `200 OK` or `404 Not Found`).
*   **Key Files**: `IncidentController`, `ThreatController`, `AuthController`, `ChatController` (WebSocket).

### B. Service Layer (The Brain)
*   **Location**: `src/main/java/com/darkshield/service`
*   **Purpose**: Contains the **Business Logic**. Controllers are dumb; they just pass data. The Service layer does the heavy lifting: checking if a threat score is > 75 to auto-escalate it to an incident, hashing passwords, calculating risk scores, and calling the Repository layer.
*   **Key Files**: `IncidentService`, `AuthService`, `AuditLogService`.

### C. Repository / Data Access Layer (The Filing Cabinet)
*   **Location**: `src/main/java/com/darkshield/repository`
*   **Purpose**: Communicates directly with the **MongoDB** database. We don't write raw SQL/NoSQL queries. Instead, we use Spring Data MongoDB interfaces which auto-generate the queries for us based on method names (e.g., `findByStatus()`).
*   **Key Files**: `IncidentRepository`, `UserRepository`, `AssetRepository`.

---

## 2. 🧩 ENTITIES vs DTOs

### Entities (Models)
*   **Location**: `src/main/java/com/darkshield/model`
*   **Purpose**: These classes represent the actual tables (collections) in our MongoDB database. An Entity maps exactly to how data is stored.
*   **Usage**: Used by the Repository layer to fetch/save data. 
*   **Examples**: `User.java`, `Incident.java`, `Threat.java`.

### DTOs (Data Transfer Objects)
*   **Location**: `src/main/java/com/darkshield/dto`
*   **Purpose**: DTOs are used to transfer data between the Frontend and Backend. We use DTOs instead of passing raw Entities for two reasons:
    1.  **Security**: We don't want to accidentally send sensitive database info (like a User's hashed password) to the frontend. We create an `AuthResponse` DTO that only contains the JWT token and Username.
    2.  **Validation**: DTOs allow us to validate incoming data (e.g., ensuring an email is valid) before it reaches the Service layer.
*   **Examples**: `LoginRequest`, `RegisterRequest`, `IncidentRequest`.

---

## 3. 🔐 SECURITY & JWT IMPLEMENTATION

We implemented a **Stateless JWT (JSON Web Token) Authentication System**.

### How it Works (The Flow):
1.  **Login**: User sends username/password to `AuthController`.
2.  **Validation**: `AuthService` checks the credentials against the DB. If correct, `JwtTokenProvider` generates a cryptic JWT string.
3.  **Token Issuance**: The backend sends the JWT back to React.
4.  **Subsequent Requests**: React attaches the JWT in the `Authorization: Bearer <token>` header for every future request.
5.  **The Filter**: Every time a request hits the backend, the `JwtAuthenticationFilter` intercepts it. It extracts the token, verifies the signature, extracts the user's roles (`ROLE_HUNTER`, `ROLE_ADMIN`), and places the user in the `SecurityContext`.

### Security Layer Files:
*   `SecurityConfig.java`: Dictates which URLs are public (`/api/auth/**`) and which require auth. Enables CORS and turns off session cookies (Stateless).
*   `JwtTokenProvider.java`: Contains the secret key. Generates and validates tokens.
*   `CustomUserDetailsService.java`: Loads the user from the database to check roles and passwords.

---

## 4. 🚨 EXCEPTION HANDLING

*   **Location**: `src/main/java/com/darkshield/exception`
*   **Purpose**: Instead of letting the app crash and showing the user a massive, ugly Java stack trace, we handle errors gracefully.
*   **Implementation**: We use a `@ControllerAdvice` class called `GlobalExceptionHandler`. If any controller throws an error (e.g., `ResourceNotFoundException` when looking for an Incident ID that doesn't exist), this class catches it and formats it into a neat JSON response like: `{ "status": 404, "message": "Incident not found" }`.

---

## 5. 🏷️ CRITICAL SPRING BOOT ANNOTATIONS

If the examiner asks "What annotations did you use?", here are the most important ones layer-by-layer:

### A. Class-Level Architecture Annotations
*   `@RestController`: Tells Spring this class handles web requests and automatically converts the returned Java objects into JSON format for the frontend.
*   `@Service`: Marks the class as holding business logic. Tells Spring to create a singleton instance of it.
*   **`@Repository`**: (Optional on Mongo interfaces, but good to know) Marks the interface as a database access object.
*   **`@Configuration`**: Marks a class as a source of bean definitions (used in `SecurityConfig`, `WebSocketConfig`).

### B. Dependency Injection Annotations
*   `@Autowired`: The magic of Spring. It automatically injects (provides) an instance of a class without you having to write `new Service()`. This is **Inversion of Control (IoC)**.

### C. Web / Routing Annotations
*   `@RequestMapping("/api/incidents")`: Sets the base URL for a controller.
*   `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`: Maps specific HTTP verbs to specific methods.
*   `@PathVariable`: Extracts values from the URL path (e.g., `/incidents/{id}`).
*   `@RequestBody`: Takes the incoming JSON from the frontend and maps it directly into a Java object (like a DTO).

### D. Security Annotations
*   `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`: Method-level security. Ensures that only a user with the specific role can execute this method. If an Analyst tries to hit the Delete Asset endpoint, Spring blocks them with a 403 Forbidden.

### E. Database Annotations (Spring Data MongoDB)
*   `@Document(collection = "incidents")`: Used on Entity classes to tell MongoDB which collection this class maps to.
*   `@Id`: Marks the field (usually a String ID) as the primary key for the database.

### F. Lombok Annotations (Boilerplate Reducers)
*   `@Data`: Automatically generates Getters, Setters, `toString()`, and `equals()` methods behind the scenes.
*   `@Builder`: Implements the Builder design pattern, allowing us to create objects cleanly (e.g., `User.builder().username("john").build()`).
*   `@NoArgsConstructor` / `@AllArgsConstructor`: Generates empty and full constructors automatically.

### G. Configuration & Setup Annotations (Core Spring Boot)
*   `@SpringBootApplication`: Found on your main `DarkshieldApplication.java` class. This is actually a combination of three annotations:
    1.  **`@Configuration`**: Marks the class as a configuration class.
    2.  **`@EnableAutoConfiguration`**: Tells Spring Boot to auto-configure the application based on the dependencies present in the `pom.xml` (like auto-configuring MongoDB when it sees the Mongo dependency).
    3.  **`@ComponentScan`**: Tells Spring to automatically scan the current package and all sub-packages to find your `@Service`, `@RestController`, and `@Component` classes and load them into memory.
*   `@Configuration`: Used in classes like `SecurityConfig` and `WebSocketConfig` to declare that this class configures settings and defines `@Bean`s.
*   `@Bean`: Used inside `@Configuration` classes. Tells Spring "Hey, the object returned by this method should be registered in the Spring Context so I can `@Autowired` it later." (e.g., `PasswordEncoder`).
*   `@EnableWebSocketMessageBroker`: Used in `WebSocketConfig` to enable our STOMP WebSockets and message routing.
*   `@ControllerAdvice`: Used on `GlobalExceptionHandler` to intercept exceptions thrown by *any* controller across the entire application.

---

## 6. 🌐 WEBSOCKETS (SOC COMMS)
*   **Why we used it**: Standard HTTP is a one-way street (Client asks $\rightarrow$ Server answers). For a real-time chat, we need two-way communication.
*   **How it works**: We use **STOMP** (Simple Text Oriented Messaging Protocol) over WebSockets.
*   **Flow**: 
    1. React establishes a persistent connection to `ws://localhost:9091/ws-chat`.
    2. React subscribes to a "Topic" (e.g., `/topic/chat/hunters`).
    3. When a user sends a message, `ChatController` uses `@MessageMapping` to receive it, and `SimpMessagingTemplate` to broadcast it to everyone subscribed to that topic instantly.

---

## 7. 📦 MAVEN DEPENDENCIES (`pom.xml`)
If asked "What libraries did you use in the backend?", refer to these core dependencies managed by Maven:

### Core Spring Boot Starters
*   **`spring-boot-starter-web`**: The heart of the backend. It brings in an embedded Apache Tomcat server (so we don't need to deploy to a separate server) and provides all the Spring MVC tools (`@RestController`, `@GetMapping`, etc.) to build RESTful APIs.
*   **`spring-boot-starter-data-mongodb`**: Replaces traditional SQL/JPA dependencies. It provides the `MongoRepository` interface and the `@Document` annotations to interact seamlessly with our NoSQL MongoDB database.
*   **`spring-boot-starter-security`**: Secures our application. It intercepts all incoming HTTP requests and forces them to be authenticated. We customized it to be stateless and work with JWTs.
*   **`spring-boot-starter-websocket`**: Provides the STOMP protocol and message broker necessary to build our real-time SOC communications (chat) without relying on external services.
*   **`spring-boot-starter-validation`**: Provides annotations like `@NotBlank` and `@Email` to automatically validate the incoming JSON requests (DTOs) before they even reach the Controller.

### Security & Utilities
*   **`jjwt-api`, `jjwt-impl`, `jjwt-jackson` (v0.12.5)**: The Java JSON Web Token library. We use this trio to securely sign (create) and parse (verify) the JWT tokens used for logging in and keeping users authenticated.
*   **`lombok`**: A compile-time tool that dramatically reduces boilerplate code. Instead of writing 50 lines of getters, setters, and constructors, we just add the `@Data` and `@Builder` annotations.
*   **`spring-boot-devtools`**: Speeds up development by providing LiveReload and automatically restarting the Spring Boot application whenever a `.java` file is changed.
