FROM envoyproxy/envoy-dev:733052a74d1e643f756a82ba3f80ef892f35dc63
COPY envoy.yaml /etc/envoy/envoy.yaml
RUN ln -sf /dev/stdout /var/log/envoy.log
